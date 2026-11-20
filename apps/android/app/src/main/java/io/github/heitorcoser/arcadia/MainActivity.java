package io.github.heitorcoser.arcadia;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Arcádia IA para Android.
 * Abre a plataforma publicada no GitHub Pages (jogos novos aparecem sozinhos)
 * e confere no GitHub Releases se existe uma versão nova do próprio app.
 */
public class MainActivity extends Activity {

    static final String SITE = "https://heitorcoser.github.io/arcadia-ia/";
    static final String API = "https://api.github.com/repos/Heitorcoser/arcadia-ia/releases/latest";

    static final String OFFLINE = "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
            + "<style>html,body{margin:0;height:100%;background:#0a0a0f;color:#ececf3;font-family:sans-serif}"
            + "body{display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;box-sizing:border-box}"
            + "p{color:#9696ab;line-height:1.6}button{height:46px;padding:0 26px;border-radius:12px;border:0;background:#8b5cf6;color:#fff;font-size:16px;font-weight:600}</style></head>"
            + "<body><div><h2>Sem conexão</h2><p>A Arcádia IA precisa de internet para carregar os jogos.</p>"
            + "<button onclick=\"location.href='" + SITE + "'\">Tentar de novo</button></div></body></html>";

    WebView web;
    long downloadId = -1;
    String urlPendente = null, versaoPendente = null;

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(0xFF0A0A0F);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " ArcadiaApp/Android/" + BuildConfig.VERSION_NAME);

        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String host = r.getUrl().getHost();
                if (host != null && host.endsWith("heitorcoser.github.io")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl())); } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) v.loadDataWithBaseURL(null, OFFLINE, "text/html", "utf-8", null);
            }
        });

        setContentView(web);
        telaCheia();

        IntentFilter filtro = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(aoBaixar, filtro, Context.RECEIVER_EXPORTED);
        else registerReceiver(aoBaixar, filtro);

        if (estado != null) web.restoreState(estado);
        else web.loadUrl(SITE);

        verificarAtualizacao();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        // voltou da tela de permissão de "instalar apps desconhecidos"
        if (urlPendente != null && getPackageManager().canRequestPackageInstalls()) {
            String u = urlPendente, v = versaoPendente;
            urlPendente = null;
            baixar(u, v);
        }
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        try { unregisterReceiver(aoBaixar); } catch (Exception ignored) {}
        web.destroy();
        super.onDestroy();
    }

    @Override
    public void onWindowFocusChanged(boolean foco) {
        super.onWindowFocusChanged(foco);
        if (foco) telaCheia();
    }

    @SuppressWarnings("deprecation")
    void telaCheia() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // a plataforma fecha o jogo / a janela de detalhes antes de sair do app
        web.evaluateJavascript("window.arcadiaVoltar ? window.arcadiaVoltar() : false", valor -> {
            if ("true".equals(valor)) return;
            if (web.canGoBack()) web.goBack();
            else super.onBackPressed();
        });
    }

    // ------------------------------------------------------------------
    // Atualização automática do app
    // ------------------------------------------------------------------
    void verificarAtualizacao() {
        new Thread(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(API).openConnection();
                c.setRequestProperty("Accept", "application/vnd.github+json");
                c.setConnectTimeout(8000);
                c.setReadTimeout(8000);
                if (c.getResponseCode() != 200) return;
                BufferedReader rd = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"));
                StringBuilder sb = new StringBuilder();
                String linha;
                while ((linha = rd.readLine()) != null) sb.append(linha);
                rd.close();

                JSONObject rel = new JSONObject(sb.toString());
                String nova = rel.getString("tag_name").replaceFirst("^v", "");
                if (comparar(nova, BuildConfig.VERSION_NAME) <= 0) return;

                String url = null;
                JSONArray assets = rel.getJSONArray("assets");
                for (int i = 0; i < assets.length(); i++) {
                    JSONObject a = assets.getJSONObject(i);
                    if (a.getString("name").endsWith(".apk")) url = a.getString("browser_download_url");
                }
                if (url == null) return;

                final String u = url;
                runOnUiThread(() -> {
                    if (isFinishing()) return;
                    new AlertDialog.Builder(this)
                            .setTitle("Atualização disponível")
                            .setMessage("A versão " + nova + " do Arcádia IA está disponível (você tem a " + BuildConfig.VERSION_NAME + "). Baixar e instalar agora?")
                            .setPositiveButton("Atualizar", (d, w) -> baixar(u, nova))
                            .setNegativeButton("Depois", null)
                            .show();
                });
            } catch (Exception ignored) {
            }
        }).start();
    }

    static int comparar(String a, String b) {
        String[] x = a.split("\\."), y = b.split("\\.");
        for (int i = 0; i < Math.max(x.length, y.length); i++) {
            int p = i < x.length ? num(x[i]) : 0, q = i < y.length ? num(y[i]) : 0;
            if (p != q) return Integer.compare(p, q);
        }
        return 0;
    }

    static int num(String s) {
        try { return Integer.parseInt(s.replaceAll("[^0-9]", "")); } catch (Exception e) { return 0; }
    }

    void baixar(String url, String versao) {
        if (!getPackageManager().canRequestPackageInstalls()) {
            urlPendente = url;
            versaoPendente = versao;
            Toast.makeText(this, "Permita que o Arcádia IA instale atualizações e volte para o app.", Toast.LENGTH_LONG).show();
            startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
            return;
        }
        DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
        r.setTitle("Arcádia IA " + versao);
        r.setDescription("Baixando atualização");
        r.setMimeType("application/vnd.android.package-archive");
        r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        r.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, "ArcadiaIA-" + versao + ".apk");
        downloadId = dm.enqueue(r);
        Toast.makeText(this, "Baixando a atualização…", Toast.LENGTH_SHORT).show();
    }

    final BroadcastReceiver aoBaixar = new BroadcastReceiver() {
        @Override
        public void onReceive(Context ctx, Intent intent) {
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            if (id != downloadId) return;
            DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            Uri apk = dm.getUriForDownloadedFile(id);
            if (apk == null) {
                Toast.makeText(ctx, "Não foi possível baixar a atualização.", Toast.LENGTH_LONG).show();
                return;
            }
            Intent instalar = new Intent(Intent.ACTION_VIEW);
            instalar.setDataAndType(apk, "application/vnd.android.package-archive");
            instalar.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            try { startActivity(instalar); } catch (Exception e) {
                Toast.makeText(ctx, "Abra o arquivo baixado para instalar.", Toast.LENGTH_LONG).show();
            }
        }
    };
}
