const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Clutter = imports.gi.Clutter;

var Future = GObject.registerClass(
  {
    GTypeName: "Future",
  },
  class Future extends GObject.Object {
    _init(argv, callback) {
      try {
        this.callback = callback;
        let [exit, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(
          null /* cwd */,
          argv /* args */,
          null /* env */,
          GLib.SpawnFlags.DO_NOT_REAP_CHILD,
          null /* child_setup */
        );

        this._dataStdout = new Gio.DataInputStream({
          base_stream: new Gio.UnixInputStream({ fd: stdout }),
        });
        new Gio.UnixInputStream({ fd: stderr, close_fd: true }).close(null);

        this._childWatch = GLib.child_watch_add(
          GLib.PRIORITY_DEFAULT,
          pid,
          (pid, status, requestObj) => {
            GLib.source_remove(this._childWatch);
          }
        );
        this._dataStdout.read_upto_async(
          "",
          0,
          0,
          null,
          this.readStdout(this)
        );
      } catch (e) {
        log(e);
      }
    }

    readStdout() {
      return (source_object, res) => {
        const [out, length] = source_object.read_upto_finish(res);
        if (length > 0) {
          log("out: " + out);
          log("length: " + length);
          this.callback(out)
          source_object.read_upto_async("", 0, 0, null, this.readStdout(this));

        } else {
          Clutter.main_quit();
        }
      };
    }
  }
);
