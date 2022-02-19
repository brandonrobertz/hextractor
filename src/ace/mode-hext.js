ace.define("ace/mode/matching_brace_outdent", ["require", "exports", "module", "ace/range"], function(e, t, n) {
  "use strict";
  var r = e("../range").Range,
    i = function() {};
  (function() {
    this.checkOutdent = function(e, t) {
      return /^\s+$/.test(e) ? /^\s*\}/.test(t) : !1
    }, this.autoOutdent = function(e, t) {
      var n = e.getLine(t),
        i = n.match(/^(\s*\})/);
      if (!i) return 0;
      var s = i[1].length,
        o = e.findMatchingBracket({
          row: t,
          column: s
        });
      if (!o || o.row == t) return 0;
      var u = this.$getIndent(e.getLine(o.row));
      e.replace(new r(t, 0, t, s - 1), u)
    }, this.$getIndent = function(e) {
      return e.match(/^\s*/)[0]
    }
  }).call(i.prototype), t.MatchingBraceOutdent = i
});

ace.define("ace/mode/hext_highlight_rules",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/text_highlight_rules"], function(require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var lang = require("../lib/lang");
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

  var HextHighlightRules = function() {
    var tagRegex = '\\??[_\\*a-z][-_a-z0-9]*';
    var attribRegex = '[@a-z0-9_\\-]+';
    var singleQuoteRegex = "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']";
    var doubleQuoteRegex = '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]';
    var regexRegex = '[/](?:(?:\\\\.)|(?:[^/\\\\]))*?[/][ic]*';
    var matchOperatorRegex = /(?:==)|(?:\$=)|(?:\*=)|(?:=)|(?:\^=)/;

    var stringPipes = lang.arrayToMap(
        ("trim|tolower|toupper|collapsews|prepend" +
         "|append|filter|replace").split("|"));
    var stringPipeToken = function(value) {
      if( stringPipes.hasOwnProperty(value.toLowerCase()) )
        return "constant.numeric";
      else
        return "storage";
    };

    var nodeTraits = lang.arrayToMap(
        (":empty|:child-count|:attribute-count|:nth-child|" +
         ":nth-last-child|:nth-of-type|:first-child|:first-of-type|" +
         ":last-child|:last-of-type|:nth-last-of-type|:only-child|" +
         ":only-of-type|:not").split("|"));
    var nodeTraitToken = function(value) {
      if( nodeTraits.hasOwnProperty(value.toLowerCase()) )
        return "entity.name.tag";
      else
        return "text";
    };


    this.$rules = {
      start: [{
        token: "keyword",
        regex: "</" + tagRegex + ">",
      }, {
        token: "keyword",
        regex: "<" + tagRegex,
        next: "node_traits",
      }, {
        token: "comment",
        regex: /#.*$/
      }, {
        defaultToken: "text"
      }],


      "tag_whitespace": [{
        token: "whitespace",
        regex: "\\s+",
      }],


      "node_traits": [{
        token: nodeTraitToken,
        regex: ":[a-z\-]+",
        next: "node_traits",
      }, {
        token: "whitespace",
        regex: " ",
        next: "attributes",
      }, {
        token: "keyword",
        regex: "/?>",
        next: "start",
      }],


      "attributes": [{
        token: "text",
        regex: attribRegex,
      }, {
        token: "entity.name.tag",
        regex: ":",
        next: "extraction",
      }, {
        token: "entity.name.tag",
        regex: "=~",
        next: "regex_match",
      }, {
        token: "entity.name.tag",
        regex: matchOperatorRegex,
        next: "attribute_value",
      }, {
        token: "constant.numeric",
        regex: "\\(",
        next: "arguments",
      }, {
        include: "tag_whitespace",
      }, {
        token: "keyword",
        regex: "/?>",
        next: "start",
      }],


      "regex_match": [{
        token: "string",
        regex: regexRegex,
        next: "attributes",
      }],


      "extraction": [{
        token: stringPipeToken,
        regex: "[a-z_]+",
        next: "attributes",
      }, {
        token: "storage",
        regex: doubleQuoteRegex,
        next: "attributes",
      }, {
        token: "storage",
        regex: singleQuoteRegex,
        next: "attributes",
      }],


      "arguments": [{
        token: "string",
        regex: doubleQuoteRegex,
      }, {
        token: "string",
        regex: singleQuoteRegex,
      }, {
        token: "string",
        regex: regexRegex,
      }, {
        token: "text",
        regex: ',',
      }, {
        include: "tag_whitespace",
      }, {
        token: "constant.numeric",
        regex: "\\)",
        next: "attributes",
      }],


      "attribute_value": [{
        token: "string",
        regex: doubleQuoteRegex,
        next: "attributes",
      }, {
        token: "string",
        regex: singleQuoteRegex,
        next: "attributes",
      }],
    };
  };

  oop.inherits(HextHighlightRules, TextHighlightRules);
  exports.HextHighlightRules = HextHighlightRules;
});
ace.define("ace/mode/hext",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/tokenizer","ace/mode/matching_brace_outdent","ace/mode/hext_highlight_rules"],function(require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextMode = require("./text").Mode;
  var Tokenizer = require("../tokenizer").Tokenizer;
  var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;
  var HextHighlightRules = require("./hext_highlight_rules").HextHighlightRules;

  var Mode = function() {
    this.HighlightRules = HextHighlightRules;
    this.$outdent = new MatchingBraceOutdent();
  };
  oop.inherits(Mode, TextMode);

  (function() {
    this.lineCommentStart = "#";

    this.getNextLineIndent = function(state, line, tab) {
      // keep indentation of previous line
      return this.$getIndent(line);
    };

    this.checkOutdent = function(state, line, input) {
      return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
      this.$outdent.autoOutdent(doc, row);
    };
  }).call(Mode.prototype);

  exports.Mode = Mode;
});

