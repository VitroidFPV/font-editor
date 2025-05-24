# OSD Font Editor

A web-based tool for editing MAX7456-compatible OSD (On-Screen Display) fonts used in FPV (First-Person View) drones and other applications.

## Features

- **Upload & Parse MCM Font Files**: Import existing MCM format font files for editing
- **Visual Font Grid**: View and navigate all 256 characters in the font set
- **Character Editing**: Precise pixel-by-pixel editing of individual font characters
- **Multi-Color Support**: Edit with black, white, and gray pixels (with transparency)
- **Grid & Tooltip Options**: Customize your editing experience with visual aids
- **Export to MCM**: Save your edited font back to MCM format for use in OSD systems
- **Export to C Header**: Export your edited font as a C header file for use in your project

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/VitroidFPV/font-editor.git
   cd font-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Upload a Font**: Click the file input and select an MCM file, then click "Read"
2. **Navigate Characters**: Use the character index input or scroll to move between characters
3. **Edit Characters**: 
   - Select a color (black, white, or gray) from the palette
   - Left-click on pixels to apply the selected color
   - Right-click to clear pixels (set to transparent)
4. **Export**: Click "Export MCM" to download your edited font file

## Technical Details

- Built with [Nuxt.js](https://nuxt.com/) (Vue.js framework)
- Uses [Nuxt UI](https://ui.nuxt.com/) for the interface components
- State management with [Pinia](https://pinia.vuejs.org/)
- MCM file parsing and generation via server API endpoints

## About MCM Fonts

MAX7456-compatible fonts are used in OSD systems for FPV drones and other applications. Each character is represented by a 12x18 pixel grid with support for transparency and multiple colors.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

Created by [VitroidFPV](https://github.com/VitroidFPV)
