import re
import hext
import pandas as pd


def clean_html(html):
    # TODO: replace this with something more robust like bleach or
    # a custom html5lib tree walk and remove iframe, link, style, script,
    # any on* events, etc
    regex = "|".join([
        "<script.*>.*</script>",
        "<link[^>]*/>",
        "<style.*>.*</style>",
        "<iframe.*>.*</iframe>",
    ])
    return re.sub(regex, "", html.replace("\n", ""))


def extract_json(template, html):
    rule = hext.Rule(template)
    document = hext.Html(html)
    return rule.extract(document)


def extract_and_flatten(table, template, html_column="html"):
    """
    Take our per-html document extracted JSON lists and
    extract the keys, add the columns to the table and
    flaten them.
    """
    # Extract the Hext columns & JSON
    htmls = table[html_column].tolist()
    jsons = []
    columns = None
    for html in htmls:
        json = extract_json(template, html)
        jsons.append(json)
        if not json:
            continue
        if not columns and json:
            columns = list(json[0].keys())

    # now actually extract the data into flat keyed columns
    # and put it into our table
    rows = table.values.tolist()
    flat_rows = []
    blank = [ None for _ in columns ]
    for i in range(len(rows)):
        row = rows[i]
        json = jsons[i]
        if not json:
            flat_rows.append(row + blank)
            continue
        for rec in json:
            flat_rows.append(row + list(rec.values()))

    new_columns = table.columns.tolist() + columns
    return pd.DataFrame(flat_rows, columns=new_columns)


def render(table, params):
    # TODO: allow users to select the source HTML column
    template = params.get("hext_template")
    html_column = "html"

    if not template:
        err_msg = (
            "Use the extractor UI on the right. Then copy and "
            "paste the Hext template to the input box below."
        )
        htmls = table[html_column].tolist()
        cleaned = [ clean_html(html) for html in htmls ]
        return (table, err_msg, {"html": cleaned})

    new_table = extract_and_flatten(table, template, html_column=html_column)
    return new_table

