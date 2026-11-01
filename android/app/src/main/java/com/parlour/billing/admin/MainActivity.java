package com.parlour.billing.admin;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.ContactsContract;
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

import org.json.JSONObject;

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
    private static final int PICK_CONTACT_REQUEST = 3;

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
        if (requestCode == PICK_CONTACT_REQUEST) {
            if (resultCode == RESULT_OK) {
                handleContactPicked(data);
            }
            return;
        }
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

    /** Called from JavaScript: opens the phone's contact picker (no contacts
     *  permission needed — the system picker answers for us). */
    public class AndroidBridge {

        @JavascriptInterface
        public void pickContact() {
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_PICK);
                    intent.setType(ContactsContract.CommonDataKinds.Phone.CONTENT_TYPE);
                    startActivityForResult(intent, PICK_CONTACT_REQUEST);
                } catch (ActivityNotFoundException e) {
                    toast("No contact app found on this phone");
                }
            });
        }

        @JavascriptInterface
        public String readClipboard() {
            try {
                ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                if (clipboard != null && clipboard.hasPrimaryClip() && clipboard.getPrimaryClip().getItemCount() > 0) {
                    CharSequence text = clipboard.getPrimaryClip().getItemAt(0).coerceToText(MainActivity.this);
                    return text == null ? "" : text.toString();
                }
            } catch (Exception ignored) {
                // Some phones block clipboard reads; the app just shows nothing.
            }
            return "";
        }

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

    /** Sends the chosen contact's name and number to the New Bill screen. */
    private void handleContactPicked(Intent data) {
        String name = "";
        String number = "";
        try {
            Uri uri = data != null ? data.getData() : null;
            if (uri != null) {
                Cursor picked = getContentResolver().query(
                        uri,
                        new String[]{ContactsContract.Data.CONTACT_ID, ContactsContract.CommonDataKinds.Phone.NUMBER},
                        null, null, null);
                if (picked != null) {
                    if (picked.moveToFirst()) {
                        String contactId = picked.getString(0);
                        number = picked.getString(1) == null ? "" : picked.getString(1);
                        if (contactId != null) {
                            Cursor names = getContentResolver().query(
                                    ContactsContract.Contacts.CONTENT_URI,
                                    new String[]{ContactsContract.Contacts.DISPLAY_NAME},
                                    ContactsContract.Contacts._ID + "=?",
                                    new String[]{contactId},
                                    null);
                            if (names != null) {
                                if (names.moveToFirst()) {
                                    name = names.getString(0) == null ? "" : names.getString(0);
                                }
                                names.close();
                            }
                        }
                    }
                    picked.close();
                }
            }
        } catch (Exception ignored) {
            // A broken contact just leaves the fields empty.
        }

        try {
            JSONObject payload = new JSONObject();
            payload.put("name", name);
            payload.put("phone", number);
            final String js = "window.__onContactPicked && window.__onContactPicked(" + payload + ")";
            runOnUiThread(() -> webView.evaluateJavascript(js, null));
        } catch (Exception ignored) {
            // Nothing to send back.
        }
    }
}
