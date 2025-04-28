# Octopi Encryption

**Octopi Encryption** is a lightweight, browser-based tool demonstrating basic encryption and transmission concepts in a fun, accessible way.
It provides real-time encryption of typed messages, with flexible configuration options.

The tool is designed to help showcase real-time processing concepts for educational demos, including integration ideas for platforms like **Agora** (e.g., sending encrypted streams or messages via real-time networks).

---

## Live Demo

> **Try it here:** [frank005.github.io/octopiencryption](https://frank005.github.io/octopiencryption)

Open the page, start typing, and watch your text be instantly encrypted!

---

## Purpose

- **Demonstrate real-time encryption** for text inputs
- **Prototype encryption concepts** for eventual use in real-time platforms like Agora
- **Visualize message processing** before transmission or storage

While simple, the architecture is built to extend toward real-world scenarios like:
- Sending encrypted metadata over Agora RTC or RTM
- Transmitting private chat or signaling messages
- Processing media data with lightweight encryption before upload

---

## Features

- 🌊 **Real-Time Encryption**: Text encrypts as you type
- 🐙 **Minimalist Design**: Clean and simple layout
- 🔍 **Customizable Options**:
  - Toggle between normal and 'octopi' encryption modes
  - Choose text casing options (uppercase, lowercase)
  - Clear input/output with a single click

> Note: The encryption used here is intentionally basic and **not** suitable for production security.

---

## Options and Settings

You can adjust the following:

| Setting | Description |
|:---|:---|
| **Octopi Mode** | Adds thematic changes to encryption (more playful, less serious) |
| **Force Uppercase** | Converts output to all caps |
| **Force Lowercase** | Converts output to all lowercase |
| **Reset** | Clears the input and output fields |

These options are configurable directly from the user interface.

---

## Project Structure

```
octopiencryption/
├── index.html    # Main webpage structure
├── styles.css    # UI styling
└── app.js        # Encryption logic and event handling
```

---

## How To Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/frank005/octopiencryption.git
   ```
2. Open `index.html` in any modern web browser.
3. Type into the input field and watch the encrypted output appear instantly.

---

## Future Plans

- Add more encryption algorithms (simple Caesar cipher, Base64, XOR)
- Allow real-time decryption preview
- Build a WebRTC/Agora messaging extension demo
- Add animated octopus mascots to respond to actions

---

## License

This project is licensed under the [MIT License](LICENSE).

Feel free to modify and use it for your own projects or demonstrations!

