"use strict";
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utilities = Me.imports.utilities;

const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

class Extension {
  constructor() {
    this._VoltageLabel = null;
    this._PowerLabel = null;
  }

  enable() {
    log(`enabling ${Me.metadata.name}`);

    let voltage_indicator = `${Me.metadata.name}_VoltageLabel`;
    let power_indicator = `${Me.metadata.name}_PowerLabel`;

    this._VoltageLabel = new PanelMenu.Button(1, voltage_indicator, true);
    this._PowerLabel = new PanelMenu.Button(1, power_indicator, true);

    this._VoltageLabel.connect("button-press-event", function () {
      log("reconnect");
    });

    let voltLabel = new St.Label({
      text: "Voltage",
      y_align: Clutter.ActorAlign.CENTER,
    });

    let powerLabel = new St.Label({
      text: "Power",
      y_align: Clutter.ActorAlign.CENTER,
    });

    this._VoltageLabel.add_child(voltLabel);
    this._PowerLabel.add_child(powerLabel);
    let commandPath = GLib.find_program_in_path("mosquitto_sub");
    let dataFuture = new Utilities.Future(
      [
        commandPath,
        "-h",
        "home.egemeric.gen.tr",
        "-t",
        "/home/egemeric/DELL_PC/ac_meter",
      ],
      (stdata) => {
        try {
          let data = JSON.parse(stdata);
          voltLabel.text = `${data.voltage.toFixed(2).toString()} V`;
          powerLabel.text = `${data.power.toFixed(2).toString()} W`;
        } catch (error) {
          log(error);
        }
      }
    );

    log(this._VoltageLabel);

    Main.panel.addToStatusArea(voltage_indicator, this._VoltageLabel);
    Main.panel.addToStatusArea(power_indicator, this._PowerLabel);
  }

  disable() {
    log(`disabling ${Me.metadata.name}`);

    this._VoltageLabel.destroy();
    this._PowerLabel.destroy();
    this._VoltageLabel = null;
    this._PowerLabel = null;
  }
}

function init() {
  log(`initializing ${Me.metadata.name}`);
  return new Extension();
}
