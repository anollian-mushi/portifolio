# Portfolio

My personal website: who I am, projects I've built, the languages and tools I use, and how to reach me.

It's plain HTML, CSS and a little JavaScript. No framework and no build step, so it runs straight from the files and GitHub Pages can host it for free.

## What's on the site

- **About:** a short intro and a few quick facts (location, focus, availability)
- **Projects:** one card per project with a description, tech tags, and links to the code and live demo
- **Skills:** grouped into languages, frameworks and tools
- **Contact:** email, GitHub and LinkedIn

It also has a dark mode that follows your system setting (with a toggle that remembers your choice) and a collapsible menu on phones.

## Files

```
index.html          page content: edit this to change text, projects and skills
style.css           layout, colours, light and dark themes
script.js           mobile menu, theme toggle, footer year
assets/favicon.svg  browser tab icon
.nojekyll           tells GitHub Pages to serve the files as they are
```

## Run it locally

Open `index.html` in a browser. That's enough.

If you'd rather have a local server (handy for testing on your phone over Wi-Fi):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Making it yours

Everything you need to change is in `index.html`. Search for these placeholders:

| Placeholder | Replace with |
| --- | --- |
| `Your Name` / `YN` | your name and initials (also in `assets/favicon.svg`) |
| The tagline under your name | one line on what you do |
| About paragraphs and facts | your background and what you're looking for |
| `Project One`, `Two`, `Three` | your real projects |
| `you@example.com` | your email |
| LinkedIn link | your profile URL |

To add a project, copy one `<article class="card">…</article>` block inside the Projects section and edit it. To add a skill, add another `<li>` to the right list.

The accent colour is `--accent` near the top of `style.css`. There's one value for light mode and one for dark mode.

## Publish with GitHub Pages

1. Merge this branch into `main`.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
4. Save. After a minute or so the site is live at `https://anollian-mushi.github.io/portifolio/`.

If you later want it at `https://anollian-mushi.github.io/` with no `/portifolio` on the end, rename the repository to `anollian-mushi.github.io`.

## License

The code is free to reuse under the [MIT License](LICENSE). The written content and project descriptions are mine.
