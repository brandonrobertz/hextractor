import re
import hext
import pandas as pd
from lxml.html.clean import Cleaner


def clean_html(html):
    cleaner = Cleaner(
        scripts=True, javascript=True, comments=True,
        style=True, links=True, embedded=True
    )
    return cleaner.clean_html(html)


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
    html_column = params.get("html_column", "html")
    css_column = params.get("css_column", "css")
    name_column = params.get("name_column", "url")
    has_template = True if template else False

    if not html_column or not css_column:
        return "Select HTML & CSS source columns to extract data from."

    if not template:
        err_msg = (
            "Use the extractor UI on the right."
        )
        # csss = table[css_column].tolist()
        htmls = table[html_column].tolist()
        names = table[name_column].tolist()
        # cleaned = [ clean_html(html) for html in htmls ]
        N = len(names)
        data = [{
            "html": htmls[i],
            # "css": csss[i],
            "name": names[i]
        } for i in range(N)]
        return (table, err_msg, {"data": data})

    new_table = extract_and_flatten(
        table, template, html_column=html_column
    )
    return (new_table, '', {})

