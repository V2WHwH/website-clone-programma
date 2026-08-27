// HoloMe for Android (v0.1) — a full-screen WebView around the HoloMe web app.
// What this shell owns: the platform URL (asked once, long-press BACK to change it),
// Android runtime permissions for camera/microphone, forwarding those grants to the
// page (getUserMedia inside the WebView), and keeping the screen awake while open.
// Everything else — pre-flight, GO LIVE, the honest strip, the ladder — is the web app.
//
// Deliberately framework-only (no AndroidX, no Gradle): see android/build-apk.mjs.
package com.hereweholo.holome;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;

public class MainActivity extends Activity {
  private static final String PREFS = "holome";
  private static final String KEY_URL = "platform_url";
  private static final int REQ_AV = 1;

  private WebView web;
  private String platformOrigin = "";
  private PermissionRequest pendingWebRequest;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

    web = new WebView(this);
    setContentView(web);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);

    web.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, String url) {
        // The platform stays inside the app; anything external goes to the real browser.
        if (platformOrigin.isEmpty() || url.startsWith(platformOrigin)) return false;
        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        return true;
      }
    });

    web.setWebChromeClient(new WebChromeClient() {
      @Override
      public void onPermissionRequest(final PermissionRequest request) {
        runOnUiThread(new Runnable() {
          @Override
          public void run() {
            handleWebPermission(request);
          }
        });
      }
    });

    String saved = prefs().getString(KEY_URL, "");
    if (saved.isEmpty()) {
      askForUrl(null);
    } else {
      load(saved);
    }
  }

  private SharedPreferences prefs() {
    return getSharedPreferences(PREFS, MODE_PRIVATE);
  }

  /** One-time setup: which Beam platform does this phone present to? */
  private void askForUrl(String prefill) {
    final EditText input = new EditText(this);
    input.setHint("https://beam.example.com");
    if (prefill != null) input.setText(prefill);
    new AlertDialog.Builder(this)
        .setTitle("HoloMe")
        .setMessage("Platform URL (ask your operator):")
        .setView(input)
        .setCancelable(false)
        .setPositiveButton("Connect", new DialogInterface.OnClickListener() {
          @Override
          public void onClick(DialogInterface d, int w) {
            String url = input.getText().toString().trim().replaceAll("/+$", "");
            if (url.isEmpty()) {
              askForUrl(null);
              return;
            }
            if (!url.contains("://")) url = "https://" + url;
            prefs().edit().putString(KEY_URL, url).apply();
            load(url);
          }
        })
        .show();
  }

  private void load(String base) {
    Uri u = Uri.parse(base);
    platformOrigin = u.getScheme() + "://" + u.getAuthority();
    // Ask for camera/mic up front so GO LIVE never stalls on a system dialog mid-flow.
    ensureAvPermissions();
    web.loadUrl(platformOrigin + "/login.html");
  }

  // ——— camera/microphone: Android runtime permission -> grant to the page ———
  private boolean hasAvPermissions() {
    return checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        && checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
  }

  private void ensureAvPermissions() {
    if (!hasAvPermissions()) {
      requestPermissions(
          new String[] {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.MODIFY_AUDIO_SETTINGS
          },
          REQ_AV);
    }
  }

  private void handleWebPermission(PermissionRequest request) {
    // Only the configured platform gets the camera — never a third-party page.
    if (!request.getOrigin().toString().startsWith(platformOrigin)) {
      request.deny();
      return;
    }
    if (hasAvPermissions()) {
      request.grant(request.getResources());
    } else {
      pendingWebRequest = request;
      ensureAvPermissions();
    }
  }

  @Override
  public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
    if (code != REQ_AV) return;
    if (pendingWebRequest != null) {
      if (hasAvPermissions()) {
        pendingWebRequest.grant(pendingWebRequest.getResources());
      } else {
        pendingWebRequest.deny(); // the page then reports "no camera" honestly
      }
      pendingWebRequest = null;
    }
  }

  // ——— navigation: BACK goes back in the app; LONG-press BACK changes the platform ———
  @Override
  public boolean onKeyDown(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_BACK) {
      event.startTracking();
      return true;
    }
    return super.onKeyDown(keyCode, event);
  }

  @Override
  public boolean onKeyLongPress(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_BACK) {
      askForUrl(prefs().getString(KEY_URL, ""));
      return true;
    }
    return super.onKeyLongPress(keyCode, event);
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_BACK && !event.isCanceled()) {
      if (web.canGoBack()) web.goBack();
      else finish();
      return true;
    }
    return super.onKeyUp(keyCode, event);
  }
}
