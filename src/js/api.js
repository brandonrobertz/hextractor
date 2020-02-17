/**
 * Send a resize message upwards to Workbench. This, as you
 * might expect, controls how tall the iFrame is on the
 * main window pane.
 */
export const resize = (size) => {
  window.parent.postMessage({
    from: 'outputIframe',
    type: 'resize',
    wfModuleId: parseInt(/(\d+)\/output/.exec(String(window.location))[1], 10),
    height: size,
  }, window.location.origin)
};

/**
 * Send a Hext template upwards to Workbench. This ultimately
 * gets set to the `hext_template` key of the Hext extractor
 * module. The value is the template.
 */
export const sendHextUpwards = (hext) => {
  let wfModuleId = null;
  try {
    wfModuleId = parseInt(/(\d+)\/output/.exec(String(window.location))[1], 10);
  } catch (e) {
    // we're not in workbench
  }
  window.parent.postMessage({
    from: 'outputIframe',
    type: 'set-params',
    params: {
      hext_template: hext
    },
    wfModuleId: wfModuleId,
  }, window.location.origin)
};
