# AeroNewsFRA Website

Public, static website for `@aeronewsfra`, deployed with GitHub Pages.

## Content workflow

The public site is driven by an editorial table. The preferred source is
`content/news.xlsx`. The first sheet must use the columns shown in
`content/news-template.csv`.

The deploy workflow converts the spreadsheet into `data/news.json` and the
site displays only rows whose `status` is `published`. Drafts remain hidden.
If no Excel file exists, the workflow uses the CSV template as a fallback.

The scheduled `Daily AeroNewsFRA research` workflow checks source feeds every
day for Frankfurt, Rhine-Main and European special-movement candidates. It
adds new results to the workbook with `status=review`. A human must verify the
source and change the row to `published`; the automation never publishes an
unverified incident by itself.

### Status values

- `draft`: not visible
- `review`: not visible
- `published`: visible on the website
- `archived`: not visible

### Local preview

From the repository root:

```powershell
python -m http.server 8080
```

Open `http://127.0.0.1:8080` afterwards.

To test the spreadsheet conversion locally, install `openpyxl` and run:

```powershell
python -m pip install openpyxl
python scripts/build_news.py
```

## Important

Do not put Meta credentials, Instagram tokens, internal instructions, or
unpublished personal data into this public repository. AeroNewsFRA is an
independent editorial project and is not an official Fraport channel.
