/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import St from "gi://St";
import Clutter from "gi://Clutter";
import Meta from "gi://Meta";
import GObject from "gi://GObject";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Shell from "gi://Shell";

// Map of base characters to their accented variants
const ACCENT_MAP = {
  a: ["à", "á", "â", "ä", "æ", "ã", "å", "ā"],
  e: ["è", "é", "ê", "ë", "ē", "ė", "ę"],
  i: ["ì", "í", "î", "ï", "ī", "į", "ı"],
  o: ["ò", "ó", "ô", "ö", "œ", "õ", "ø", "ō"],
  u: ["ù", "ú", "û", "ü", "ū", "ů", "ų"],
  y: ["ý", "ÿ", "ŷ"],
  n: ["ñ", "ń", "ņ", "ň"],
  c: ["ç", "ć", "č", "ĉ"],
  s: ["ś", "š", "ş", "ș"],
  z: ["ź", "ž", "ż"],
  l: ["ł", "ĺ", "ļ", "ľ", "ŀ"],
  A: ["À", "Á", "Â", "Ä", "Æ", "Ã", "Å", "Ā"],
  E: ["È", "É", "Ê", "Ë", "Ē", "Ė", "Ę"],
  I: ["Ì", "Í", "Î", "Ï", "Ī", "Į", "İ"],
  O: ["Ò", "Ó", "Ô", "Ö", "Œ", "Õ", "Ø", "Ō"],
  U: ["Ù", "Ú", "Û", "Ü", "Ū", "Ů", "Ų"],
  Y: ["Ý", "Ÿ", "Ŷ"],
  N: ["Ñ", "Ń", "Ņ", "Ň"],
  C: ["Ç", "Ć", "Č", "Ĉ"],
  S: ["Ś", "Š", "Ş", "Ș"],
  Z: ["Ź", "Ž", "Ż"],
  L: ["Ł", "Ĺ", "Ļ", "Ľ", "Ŀ"],
};

export default class AccentyExtension extends Extension {
  enable() {
    try {
      this._settings = new Gio.Settings({
        schema_id: "org.gnome.shell.extensions.accenty",
      });
    } catch (e) {
      log(`Accenty: Failed to load settings schema: ${e}`);
      Main.notify(
        "Accenty Extension",
        "Failed to load settings schema. Please ensure it is installed and compiled."
      );
      return;
    }
    // Always remove keybinding before adding to avoid duplicates
    Main.wm.removeKeybinding("show-accenty-popup");
    Main.wm.addKeybinding(
      "show-accenty-popup",
      this._settings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.ALL,
      this._onShowPopup.bind(this)
    );
    this._accentPopup = null;
    this._selectedIndex = 0;
    this._accentButtons = [];
    this._baseChar = null;
    this._keyPressHandlerId = null;
    // Listen for window focus changes to auto-close popup
    this._windowFocusSignal = global.display.connect(
      "notify::focus-window",
      () => this._destroyPopup()
    );
  }

  disable() {
    Main.wm.removeKeybinding("show-accenty-popup");
    if (this._keyPressHandlerId) {
      global.stage.disconnect(this._keyPressHandlerId);
      this._keyPressHandlerId = null;
    }
    if (this._windowFocusSignal) {
      global.display.disconnect(this._windowFocusSignal);
      this._windowFocusSignal = null;
    }
    this._destroyPopup();
  }

  _onShowPopup() {
    if (this._accentPopup) return;
    this._baseChar = null;
    this._showBaseCharPrompt();
    this._keyPressHandlerId = global.stage.connect(
      "key-press-event",
      this._onBaseCharKeyPress.bind(this)
    );
  }

  _showBaseCharPrompt() {
    if (this._accentPopup) {
      this._accentPopup.destroy();
      this._accentPopup = null;
      this._accentButtons = [];
    }

    this._accentPopup = new St.BoxLayout({
      style_class: "accenty-popup",
      vertical: false,
      reactive: true,
      x_align: Clutter.ActorAlign.CENTER,
      y_align: Clutter.ActorAlign.CENTER,
    });

    let label = new St.Label({
      text: "Type a letter for accents...",
      style: "font-size: 20px; color: white; padding: 12px;",
    });

    this._accentPopup.add_child(label);
    Main.uiGroup.add_child(this._accentPopup);

    let monitor = Main.layoutManager.primaryMonitor;
    this._accentPopup.set_position(
      Math.floor(monitor.x + (monitor.width - this._accentPopup.width) / 2),
      Math.floor(monitor.y + (monitor.height - this._accentPopup.height) / 2)
    );

    // Add animation for a smoother appearance
    this._accentPopup.opacity = 0;
    this._accentPopup.scale_x = 0.8;
    this._accentPopup.scale_y = 0.8;
    this._accentPopup.ease({
      opacity: 255,
      scale_x: 1.0,
      scale_y: 1.0,
      duration: 200,
      mode: Clutter.AnimationMode.EASE_OUT_QUAD,
    });

    // Focus the label for accessibility
    label.grab_key_focus();
  }

  _onBaseCharKeyPress(actor, event) {
    let keyval = event.get_key_symbol();
    let unichar = String.fromCharCode(Clutter.keysym_to_unicode(keyval));
    if (ACCENT_MAP[unichar]) {
      this._baseChar = unichar;
      global.stage.disconnect(this._keyPressHandlerId);
      this._keyPressHandlerId = global.stage.connect(
        "key-press-event",
        this._onAccentMenuKeyPress.bind(this)
      );
      this._showAccentPopup(unichar);
      return Clutter.EVENT_STOP;
    } else if (keyval === Clutter.KEY_Escape) {
      this._destroyPopup();
      global.stage.disconnect(this._keyPressHandlerId);
      this._keyPressHandlerId = null;
      return Clutter.EVENT_STOP;
    }
    return Clutter.EVENT_STOP;
  }

  _showAccentPopup(key) {
    // Don't destroy the existing popup immediately to avoid flicker
    if (this._accentPopup) {
      this._accentPopup.destroy();
      this._accentPopup = null;
      this._accentButtons = [];
    }

    const accents = ACCENT_MAP[key];
    if (!accents || accents.length === 0) return;

    this._accentPopup = new St.BoxLayout({
      style_class: "accenty-popup",
      vertical: false,
      reactive: true,
      x_align: Clutter.ActorAlign.CENTER,
      y_align: Clutter.ActorAlign.CENTER,
    });

    this._accentButtons = [];
    this._selectedIndex = 0;
    this._addAccentButton(key, 0);
    accents.forEach((accent, index) => {
      this._addAccentButton(accent, index + 1);
    });

    Main.uiGroup.add_child(this._accentPopup);
    let monitor = Main.layoutManager.primaryMonitor;
    this._accentPopup.set_position(
      Math.floor(monitor.x + (monitor.width - this._accentPopup.width) / 2),
      Math.floor(monitor.y + (monitor.height - this._accentPopup.height) / 2)
    );

    // Add animation for a smoother appearance
    this._accentPopup.opacity = 0;
    this._accentPopup.scale_x = 0.8;
    this._accentPopup.scale_y = 0.8;
    this._accentPopup.ease({
      opacity: 255,
      scale_x: 1.0,
      scale_y: 1.0,
      duration: 200,
      mode: Clutter.AnimationMode.EASE_OUT_QUAD,
    });

    this._highlightButton(0);
    // Focus the first button for keyboard navigation
    if (this._accentButtons.length > 0) {
      this._accentButtons[0].grab_key_focus();
    }
  }

  _onAccentMenuKeyPress(actor, event) {
    let keyval = event.get_key_symbol();
    switch (keyval) {
      case Clutter.KEY_Left:
        this._highlightButton(
          (this._selectedIndex - 1 + this._accentButtons.length) %
            this._accentButtons.length
        );
        // Focus the newly selected button for accessibility
        this._accentButtons[this._selectedIndex].grab_key_focus();
        return Clutter.EVENT_STOP;
      case Clutter.KEY_Right:
        this._highlightButton(
          (this._selectedIndex + 1) % this._accentButtons.length
        );
        // Focus the newly selected button for accessibility
        this._accentButtons[this._selectedIndex].grab_key_focus();
        return Clutter.EVENT_STOP;
      case Clutter.KEY_space:
      case Clutter.KEY_Return:
        // Always use the selected index for both mouse and keyboard
        const character = this._accentButtons[this._selectedIndex].get_label();
        this._copyAccentToClipboard(character);
        return Clutter.EVENT_STOP;
      case Clutter.KEY_Escape:
        this._destroyPopup();
        if (this._keyPressHandlerId) {
          global.stage.disconnect(this._keyPressHandlerId);
          this._keyPressHandlerId = null;
        }
        return Clutter.EVENT_STOP;
      default:
        this._destroyPopup();
        if (this._keyPressHandlerId) {
          global.stage.disconnect(this._keyPressHandlerId);
          this._keyPressHandlerId = null;
        }
        return Clutter.EVENT_PROPAGATE;
    }
  }

  _addAccentButton(character, index) {
    let button = new St.Button({
      label: character,
      style_class: "accenty-button",
      reactive: true,
      can_focus: true,
    });

    button.connect("clicked", () => {
      this._copyAccentToClipboard(character);
    });

    this._accentPopup.add_child(button);
    this._accentButtons.push(button);
  }

  _highlightButton(index) {
    this._accentButtons.forEach((btn, i) => {
      if (i === index) {
        btn.add_style_class_name("accenty-button-selected");
      } else {
        btn.remove_style_class_name("accenty-button-selected");
      }
    });

    this._selectedIndex = index;
  }

  _copyAccentToClipboard(character) {
    let clipboard = St.Clipboard.get_default();
    clipboard.set_text(St.ClipboardType.CLIPBOARD, character);
    Main.notify("Accenty", `Copied: ${character}`); // Debug notification
    this._cleanupAfterInsert();
  }

  _cleanupAfterInsert() {
    this._destroyPopup();
    if (this._keyPressHandlerId) {
      global.stage.disconnect(this._keyPressHandlerId);
      this._keyPressHandlerId = null;
    }
  }

  _destroyPopup() {
    if (this._accentPopup) {
      // Add animation when closing popup
      this._accentPopup.ease({
        opacity: 0,
        scale_x: 0.8,
        scale_y: 0.8,
        duration: 150,
        mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        onComplete: () => {
          if (this._accentPopup) {
            this._accentPopup.destroy();
            this._accentPopup = null;
            this._accentButtons = [];
          }
        },
      });
    }
  }
}
