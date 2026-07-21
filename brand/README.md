# Brand source artwork

`swingpop_admin_logo.png` and `swingpop_logo.png` are the 819×819 originals the
app icons in `public/icons/` are cut from. Kept here so the icons can be
regenerated; they are not served, and nothing imports them.

The icons are produced by cropping a centred 750px square — the artwork sits in
the middle of the source with a wide margin, and the outer ring spans about
729px, so cropping makes the circle fill the tile instead of floating.

- `icon-192`, `icon-512`, `apple-touch-icon` — the admin logo, cropped to fill.
- `icon-maskable-512` — the admin logo again, but shrunk so its ring lands near
  76% of the canvas. A launcher may crop a maskable icon to a circle 80% across,
  which would otherwise shave the ring and the ADMIN line.
- `favicon-32` — the plain logo. The favicon shows on the public site too, where
  an ADMIN badge would be wrong.

Channel values are rounded to steps of 10 before saving. The paper texture is
noise that PNG cannot compress, and the five icons came to 926KB untouched;
rounding brings that to 340KB with the average colour moving by at most 2.4/255.
Palette conversion was tried first and rejected — GDI+ dithers to a fixed
palette and turned the cream background yellow-green with pink speckles.
