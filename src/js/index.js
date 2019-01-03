import $ from 'jquery';

import findLCA from 'js/lca';
import html2hext from 'js/html2hext';
import {
  selectedClass, selectedParentClass,
  overClass
} from 'js/constants';

let LCA = null;
let docIx = -1;

/**
 * Set up the mouse over and clicking functionality
 * along with the highlighting of the LCA.
 */
export const runUI = () => {
  // clear the chunk display
  // $("#lca-html").text("").html();
  $("#hext-template-copyable").val("");
  $("#hext-template-copyable").addClass("hidden");

  // grab all HTML document's elements
  const els = $("#main").find("*");
  let selectedEls = [];
  let parentNode = null;

  // we need both enter/leave and over/out pairs
  // for this to work correctly with nested nodes
  els.on("mouseenter mouseover", (e) => {
    e.stopPropagation();
    $(e.target).addClass(overClass);
  });
  els.on("mouseleave mouseout", (e) => {
    e.stopPropagation();
    $(e.target).removeClass(overClass);
  });

  // when we click, add the node to our node list
  // and also outline it
  els.on("click", (e) => {
    // don't propogate click upwards
    e.preventDefault()
    e.stopPropagation();

    // add to selected
    const selIx = selectedEls.indexOf(e);
    if(selIx === -1) {
      $(e.target).addClass(selectedClass);
      selectedEls.push(e);
    }
    // remove from selected
    else {
      $(e.target).removeClass(selectedClass);
      selectedEls.splice(selIx, 1);
    }

    // highlight parent element if we have some nodes
    const lca = findLCA(selectedEls);
    $("*").removeClass(selectedParentClass);
    $(lca).addClass(selectedParentClass);

    // this really shouldn't happen anymore. but we have
    // to recover from the possibility somehow
    if (!lca) {
      $("*").removeClass(selectedParentClass);
      $("*").removeClass(selectedClass);
      selectedEls = [];
    }
    // we have an LCA, grab the outerHTML and display the chunk
    else {
      // NOTE: if overClass changes, this needs to change
      const chunk = lca.outerHTML.replace(/\s*autoscrape-over\s*/, " ");
      // $("#lca-html").text(chunk).html();
      LCA = chunk;
    }
  });
};

const makeid = (n) => {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < n; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

const markAll = () => {
  $('*').contents().filter(function() {
    return this.nodeType == 3;
  }).each(function(){
    // map ID to original text
    this.textContent = makeid(32);
  });
};

/**
 * Cancel all handlers and freeze the HTML chunk.
 */
const stopUI = () => {
  const els = $("#main").find("*");
  els.removeClass(overClass);
  els.off();
  els.on("click", (e) => {
    e.preventDefault()
    e.stopPropagation();
  });
  $("#complete").hide();
};

const resize = (size) => {
  window.parent.postMessage({
    from: 'outputIframe',
    type: 'resize',
    wfModuleId: parseInt(/(\d+)\/output/.exec(String(window.location))[1], 10),
    height: size,
  }, window.location.origin)
};

const sendHextUpwards = (hext) => {
  window.parent.postMessage({
    from: 'outputIframe',
    type: 'set-params',
    params: {
      hext_template: hext
    },
    wfModuleId: parseInt(/(\d+)\/output/.exec(String(window.location))[1], 10),
  }, window.location.origin)
};

/**
 * TODO: remove iframe, link, style, script
 * TODO: remove all event listeners before adding any
 * of our own here.
 * TODO: go through all links and remove/replace the href?
 * this will mess with the DOM though and would break the
 * Hext template.
 *
 * I have done this manually in the HTML document, but we
 * need to think about potential security problems here
 * w.r.t. loading arbitarty HTML and rendering it.
 */
const dataReady = (data) => {
  if (!data.html) {
    console.error("HTML document is blank.");
  }
  $("#complete").hide();
  // increment document number, update display
  docIx = ++docIx % data.html.length;
  $("#current").text(docIx + 1);
  $("#total").text(data.html.length);

  $("#main").html(data.html[docIx]);

  $("#complete").show();
  runUI();
  $("#complete").on("click", () => {
    $("#complete").hide();
    stopUI();
    const hext = html2hext(LCA.replace("\n", "").trim());
    $("#hext-template-copyable").val(hext);
    $("#hext-template textarea").removeClass("hidden");
    sendHextUpwards(hext);
  });
  $("#cancel").on("click", () => {
    stopUI();
    LCA = null;
    docIx = -1;
    runUI();
  });
};

export const startLoading = (d) => {
  const url = String(window.location).replace(/\/output.*/, '/embeddata')
  fetch(url, { credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Invalid response code: ' + response.status)
      }
      return response.json()
    })
    .then((data) => {
      if (!data.html) {
        resize(0);
      }
      else {
        $("#prev").on("click", dataReady.bind(this, data));
        $("#next").on("click", dataReady.bind(this, data));
        resize(500);
        dataReady(data);
      }
    })
    .catch(console.error)
};

window.addEventListener('hashchange', startLoading);
startLoading();

