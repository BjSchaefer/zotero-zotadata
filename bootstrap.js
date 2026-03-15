// Zotero 7 (Firefox 115) and Zotero 8 (Firefox 128+) compatible bootstrap
// Services is a global in Firefox 128+; for Firefox 115 we import the ESModule
if (typeof Services === "undefined") {
    var { Services } = ChromeUtils.importESModule(
        "resource://gre/modules/Services.sys.mjs"
    );
}

var Zotadata;

function startup({ id, version, rootURI }, reason) {
    // Load main plugin logic
    Services.scriptloader.loadSubScript(rootURI + "zotadata.js");

    // Initialize plugin
    Zotadata.init({ id, version, rootURI });
    Zotadata.addToAllWindows();

    // Listen for new windows
    var windowListener = {
        onOpenWindow: function(xulWindow) {
            // Use docShell.domWindow (works in both Firefox 115 and 128+)
            var domWindow = xulWindow.docShell?.domWindow;
            if (!domWindow) return;

            domWindow.addEventListener("load", function() {
                if (domWindow.ZoteroPane) {
                    Zotadata.addToWindow(domWindow);
                }
            }, false);
        },
        onCloseWindow: function(xulWindow) {},
        onWindowTitleChange: function(xulWindow, newTitle) {}
    };
    Services.wm.addListener(windowListener);

    // Store reference to remove later
    Zotadata.windowListener = windowListener;
}

function shutdown(data, reason) {
    if (reason == APP_SHUTDOWN) return;

    if (Zotadata) {
        // Remove from all windows
        Zotadata.removeFromAllWindows();

        // Unregister notifier
        if (Zotadata.notifierID) {
            Zotero.Notifier.unregisterObserver(Zotadata.notifierID);
        }

        // Remove window listener
        if (Zotadata.windowListener) {
            Services.wm.removeListener(Zotadata.windowListener);
        }

        // Close any open progress windows
        if (Zotadata.progressWindow) {
            Zotadata.progressWindow.close();
        }
    }
}

function install(data, reason) {
    // Called when the add-on is first installed
}

function uninstall(data, reason) {
    // Called when the add-on is uninstalled
}
