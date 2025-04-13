# Yuming He - Personal Website

A minimalist, professional personal website for Yuming He showcasing research and academic work. The website features a clean design with a black, white, and red color scheme.

## Features

- Responsive design that works on all devices
- Minimalist and professional aesthetic
- Sections for work, publications, talks, and contact information
- Smooth scrolling and animations
- Lightweight implementation with vanilla HTML, CSS, and JavaScript

## Technologies Used

- HTML5
- CSS3 (with CSS variables for theming)
- Vanilla JavaScript
- Google Fonts (Inter)

## Project Structure

```
yuming-web/
├── index.html              # Main HTML file
├── src/
│   ├── main.js             # Main JavaScript file
│   ├── components/         # Component directory (unused in current version)
│   ├── pages/              # Pages directory (unused in current version)
│   └── styles/
│       ├── main.css        # Main stylesheet
│       └── normalize.css   # CSS normalization
├── public/                 # Public assets directory
└── README.md               # This file
```

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/username/yuming-web.git
   cd yuming-web
   ```

2. Open the project in your code editor.

3. To view the website locally, you can use any local server. For example, with Python:
   ```
   # Python 3
   python -m http.server
   
   # Python 2
   python -m SimpleHTTPServer
   ```

4. Visit `http://localhost:8000` in your browser.

## Customization

### Changing Colors

The color scheme is defined in `src/styles/main.css` using CSS variables. Modify the values in the `:root` selector to change the colors throughout the site:

```css
:root {
  --color-black: #000000;
  --color-white: #ffffff;
  --color-red: #ff0000;
  --color-light-gray: #f7f7f7;
  --color-gray: #a5a5a5;
  --color-dark-gray: #333333;
}
```

### Adding Content

To add or modify content, edit the `index.html` file. The website is structured with clearly labeled sections that correspond to the navigation menu:

- `#work` - Work and projects
- `#about` - About information
- `#publications` - Academic publications
- `#talks` - Talks and presentations
- `#contact` - Contact information

## Deployment

This website can be deployed to any static web hosting service, such as:

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- AWS S3

## License

This project is licensed under the MIT License.

## Credits

- Design inspired by [Giorgia Lupi's website](https://giorgialupi.com/)
- Normalize.css by Nicolas Gallagher and Jonathan Neal 