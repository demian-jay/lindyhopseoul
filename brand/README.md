# Brand source artwork

`swingpop_admin_logo.png` and `swingpop_logo.png` are the 819×819 originals the
app icons in `public/icons/` are cut from. Kept here so the icons can be
regenerated; they are not served, and nothing imports them.

The icons are produced by cropping a centred 750px square — the artwork sits in
the middle of the source with a wide margin, and the outer ring spans about
729px, so cropping makes the circle fill the tile instead of floating.

There are two sets, one per app: the members app installs from
swingpopseoul.com and the admin one from admin.swingpopseoul.com, so an ADMIN
badge on a member's home screen would be wrong. The `admin-` prefix marks the
admin set; the unprefixed names are the members app's, which is every host but
one and so the default the document ships with.

- `icon-192`, `icon-512`, `apple-touch-icon` — the plain logo, cropped to fill.
- `admin-icon-192`, `admin-icon-512`, `admin-apple-touch-icon` — the admin logo,
  cropped the same way.
- `icon-maskable-512`, `admin-icon-maskable-512` — the same logos shrunk so the
  ring lands near 76% of the canvas. A launcher may crop a maskable icon to a
  circle 80% across, which would otherwise shave the ring and the ADMIN line.
- `favicon-32` — the plain logo, shared: a browser tab is a tab either way.

Channel values are rounded to steps of 10 before saving. The paper texture is
noise that PNG cannot compress, and the five icons came to 926KB untouched;
rounding brings that to 340KB with the average colour moving by at most 2.4/255.
Palette conversion was tried first and rejected — GDI+ dithers to a fixed
palette and turned the cream background yellow-green with pink speckles.
