export const resize = (size) => {
  window.parent.postMessage({
    from: 'outputIframe',
    type: 'resize',
    wfModuleId: parseInt(/(\d+)\/output/.exec(String(window.location))[1], 10),
    height: size,
  }, window.location.origin)
};

export const sendHextUpwards = (hext) => {
  window.parent.postMessage({
    from: 'outputIframe',
    type: 'set-params',
    params: {
      hext_template: hext
    },
    wfModuleId: parseInt(/(\d+)\/output/.exec(String(window.location))[1], 10),
  }, window.location.origin)
};


