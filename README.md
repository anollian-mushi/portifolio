# Anollian Mushi · Portfolio

My personal website. I'm a software developer in Arusha, Tanzania, studying Computer Engineering at MUST. I build business systems in Laravel and Python and do web design and hosting. The site covers my work experience, projects, skills, and how to reach me.

It's plain HTML, CSS and a little JavaScript. No framework and no build step, so it runs straight from the files and GitHub Pages can host it for free.

## What's on the site

- **About:** who I am, what I build, and what kind of work I'm looking for
- **Experience:** Flex Corporate Services, Nyika Essence Safaris and Vision Fund Tanzania
- **Projects:** Sala Za Kikatoliki (Android, 1,000+ downloads on Google Play), an inventory and asset management system in Laravel, the Nyika Essence Safaris website, an invoice and delivery note system, and a hotel management system
- **Skills:** languages, frameworks, tools, systems and remote-work tools
- **Education & certifications:** Diploma in Computer Engineering at MUST, and an Advanced Excel certificate
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

## Updating the content

All the text is in `index.html`, one `<section>` per part of the page.

- **New job:** copy a `<li class="job">…</li>` block at the top of the Experience list.
- **New project:** copy an `<article class="card">…</article>` block in the Projects section. Leave out the "Code" link if the repository is private.
- **New skill:** add an `<li>` to the right list in the Skills section.

The accent colour is `--accent` near the top of `style.css`. There's one value for light mode and one for dark mode.

## Publish with GitHub Pages

1. Merge this branch into `main`.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
4. Save. After a minute or so the site is live at `https://anollian-mushi.github.io/portifolio/`.

If you later want it at `https://anollian-mushi.github.io/` with no `/portifolio` on the end, rename the repository to `anollian-mushi.github.io`.

## License

The code is free to reuse under the [MIT License](LICENSE). The written content and project descriptions are mine.
