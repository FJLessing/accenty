# Accenty - Mac-style Accent Menu for GNOME Shell

Accenty is a GNOME Shell extension that provides a quick way to type accented characters similar to macOS. Instead of trying to remember keyboard combinations, you can simply select accented variants visually from a popup menu.

## Features

- Open the accent menu with a configurable shortcut (default: <kbd>Super</kbd> + <kbd>=</kbd>)
- Type a base letter (e.g., 'a') to show a popup with all available accented variants
- Navigate between accent options using the left and right arrow keys
- Select an accent using the Spacebar or Return key (the character is copied to your clipboard)
- Cancel with the Escape key

## Supported Characters

The extension supports accented variants for many Latin alphabet characters:
- Vowels: a, e, i, o, u, y (à, á, â, ä, é, è, etc.)
- Consonants: n, c, s, z, l (ñ, ç, š, etc.)
- All uppercase variants are also supported

## Installation

### From source

1. Clone or download this repository
2. Copy the folder to `~/.local/share/gnome-shell/extensions/`
3. Enable the extension using one of these methods:

   **For Wayland sessions (default in Ubuntu 25.04):**
   - Log out and log back in to your session
   - OR use the GNOME Extensions app: `gnome-extensions-app`
   - OR use the command line: `gnome-extensions enable accenty@fjlessing.co.za`
   
   **For X11 sessions:**
   - Press Alt+F2, type 'r', press Enter to restart GNOME Shell
   - Enable the extension using GNOME Extensions app

### Install the GSettings schema

From the extension directory, run:

```sh
mkdir -p ~/.local/share/glib-2.0/schemas
cp org.gnome.shell.extensions.accenty.gschema.xml ~/.local/share/glib-2.0/schemas/
glib-compile-schemas ~/.local/share/glib-2.0/schemas/
```

### Set or change the shortcut

To change the shortcut, use:

```sh
gsettings set org.gnome.shell.extensions.accenty show-accenty-popup "['<Super>equal']"
```

You can use other key combinations, e.g. `<Super>a`, `<Ctrl><Alt>a`, etc.

## Usage

1. Click inside any text field where you want to type an accented character
2. Press the shortcut (default: <kbd>Super</kbd> + <kbd>=</kbd>) to open the accent menu
3. Type the base letter you want to accent (e.g., 'a', 'e', 'o')
4. A popup will appear showing all available accented variants of that letter
5. Use left/right arrow keys to navigate between the options
6. Press Spacebar or Return to select the highlighted character
7. The selected character is copied to your clipboard
8. Paste the character where you want it (Ctrl+V or middle-click)
9. Press Escape at any time to cancel

## Clipboard Behavior

**Note:** The extension only copies the selected accented character to your clipboard. You must manually paste it (Ctrl+V or middle-click) into your text field.

## Troubleshooting

If the extension doesn't work as expected:

- Check if the extension is enabled: run `gnome-extensions list --enabled | grep accenty`
- Make sure your GNOME Shell version is compatible (this extension supports GNOME 48)
- Look for errors in the system logs: `journalctl -f -o cat /usr/bin/gnome-shell`
- Try manually enabling with: `gnome-extensions enable accenty@fjlessing.co.za`
- Ensure the GSettings schema is installed and compiled (see above)

## License

This extension is licensed under the GNU General Public License v3.0.
