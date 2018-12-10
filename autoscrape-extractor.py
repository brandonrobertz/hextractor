import re


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
    # regex = "<script.*>.*</script>|<link[^>]*/>"
    return re.sub(regex, "", html.replace("\n", ""))


def render(table, params):
    err_msg = (
        "Use the extractor UI on the right then paste "
        "the results to the above input box."
    )
    if not params.get("hext_template"):
        htmls = table["html"].tolist()
        cleaned = [ clean_html(html) for html in htmls ]
        return (table, err_msg, {"html": cleaned})

    # TODO: if template in param, run hext on records and return results
    return table

