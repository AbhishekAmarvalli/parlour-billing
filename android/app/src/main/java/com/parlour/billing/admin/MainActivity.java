package com.parlour.billing.admin;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Thin wrapper around the bundled admin web app (built from admin-app/).
 * WebViewAssetLoader serves the files as https://appassets.androidplatform.net/...
 * so IndexedDB, localStorage and crypto behave exactly like in a browser.
 */
public class MainActivity extends Activity {

    private static final String APP_URL = "https://appassets.androidplatform.net/index.html";
    private static final int FILE_CHOOSER_REQUEST = 1;
    private static final int STORAGE_PERMISSION_REQUEST = 2;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private WebChromeClient.FileChooserParams filePathParams;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true); // localStorage (the PIN)
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setTextZoom(100); // respect the app's own type scale, not system zoom

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain("appassets.androidplatform.net")
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false; // every page stays inside the app
            }
        });

        // Lets the web app save Excel / PDF / backup files to the Download folder.
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        // Older phones need one permission to write into the Download folder.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
                && checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)
                        != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{android.Manifest.permission.WRITE_EXTERNAL_STORAGE},
                    STORAGE_PERMISSION_REQUEST);
        }

        // Lets the web app ask for a backup file to open (Settings).
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                filePathParams = params;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                } catch (ActivityNotFoundException e) {
                    filePathCallback = null;
                    filePathParams = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState == null) {
            webView.loadUrl(APP_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback == null) {
                return;
            }
            Uri[] results = filePathParams != null ? filePathParams.parseResult(resultCode, data) : null;
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
            filePathParams = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        webView.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }

    /** Called from JavaScript: saves base64 bytes into the phone's Download folder. */
    public class AndroidBridge {

        @JavascriptInterface
        public void saveFile(String name, String base64) {
            try {
                byte[] bytes = Base64.decode(base64, Base64.NO_WRAP);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                    values.put(MediaStore.Downloads.MIME_TYPE, mimeType(name));
                    values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri == null) {
                        throw new IllegalStateException("Could not create the file");
                    }
                    OutputStream out = getContentResolver().openOutputStream(uri);
                    if (out == null) {
                        throw new IllegalStateException("Could not open the file");
                    }
                    out.write(bytes);
                    out.close();
                } else {
                    File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    File outFile = new File(dir, name);
                    FileOutputStream fos = new FileOutputStream(outFile);
                    fos.write(bytes);
                    fos.close();
                }
                toast("Saved to Downloads: " + name);
            } catch (Exception e) {
                toast("Could not save the file");
            }
        }

        private String mimeType(String name) {
            String lower = name.toLowerCase();
            if (lower.endsWith(".xlsx")) {
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            }
            if (lower.endsWith(".pdf")) {
                return "application/pdf";
            }
            return "application/json";
        }

        private void toast(final String message) {
            runOnUiThread(() -> Toast.makeText(MainActivity.this, message, Toast.LENGTH_LONG).show());
        }
    }
}
