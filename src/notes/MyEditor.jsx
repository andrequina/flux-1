// Import React and other libraries
import React from 'react'
import { Editor, Block , Raw, Text, Plain } from 'slate'
import AutoReplace from 'slate-auto-replace'
import { List } from 'immutable'
import getOffsets from 'positions'
import moment from 'moment';
// Application Components:
import EditorToolbar from './EditorToolbar';
// Styling
import './MyEditor.css';

//TODO: make this a one line destructuring
import structuredDataRaw from './structuredDataRaw';
const staging = structuredDataRaw.find((element, index, array) => element.label === 'staging')
const stagingState = Raw.deserialize(staging.block, { terse: true });
const progression = structuredDataRaw.find((element, index, array) => element.label === 'progression')
const progressionState = Raw.deserialize(progression.block, { terse: true });

const initialState = Plain.deserialize('');
/*const initialState = Raw.deserialize({
  nodes: [
    {
      kind: 'block',
      type: 'paragraph-span',
      nodes: [
        {
          kind: 'text',
          text: 'Begin typing your clinical notes below.'
        }
      ]
    },
    {
      kind: 'block',
      type: 'paragraph-span',
      nodes: [
        {
          kind: 'text',
          text: 'Add a space at the end of this line to trigger a inline template: #staging'
        }
      ]
    }
  ]
}, { terse: true })*/

const DEFAULT_NODE = 'paragraph';

// Given a list of nodes and an id, check to see if there is a (shallow) node in that list with that id
// AGAIN: Not a deep search
function getNodeById(nodes, id) {
  return nodes.find(function(v, k, iter) {
    if (v.data) {
      return v.data.get('id') === id;
    } else {
      return false;
    }
  });
}

// Given a current node and an array of keys, add the key of this node and the keys of all its children
// to the array.
function addKeysForNode(curNode, keys) {
  // Get this key
  if(curNode.key) {
    keys.push(curNode.key)
  }
  //For all children
  if (curNode.nodes) {
    for(const child of curNode.nodes) {
      // update keys to include all the child's added to current collection
      keys = addKeysForNode(child, keys);
    }
  }
  return keys;
}

// The list of special keys we want to trigger special behavior

// Define our app...
class MyEditor extends React.Component {
  constructor(props) {
    super(props);

	if (!this.props.patient) {
		this.placeholder = "Create your data item here then copy and paste it into your EHR Notes entry area";
	} else {
		this.placeholder = "Enter your clinical note here identifying key data items using # shortcuts such as #progression or #toxicity...";
	}
	
    // Set the initial state when the app is first constructed.
    this.state = {
      // Autocomplete config
      inAutocomplete: false,
      autocompleteText: "",
      autocompleteMatches: [],
      currentAutocompleteMatch: null,
      autocompleteOptions: structuredDataRaw,
      // Shorthand config
      inShorthand: false,
      shorthandText: "",
      shorthandMatches: [],
      currentShorthandMatch: null,
      shorthandOptions: Object.keys(this.props.data.patient).map((elem) => {const newObj = {}; newObj["label"] = elem; newObj["value"] = this.props.data.patient[elem]; return newObj}) ,
      // Tracking progression
      progression: {},
      // State of editor config
      state: initialState,
      schema: {
        nodes: {
          'paragraph':     props => <p {...props.attributes}>{props.children}</p>,
          'paragraph-span': (props) => {
            return (
              <span>
                <div className="clear"></div> 
                <p {...props.attributes}>{props.children}</p>
              </span>
              )
          },
          'structured-span':          (props) => {
            const id = (props.node) ? props.node.data.get('id') : '';
            return <span id={id} {...props.attributes}>{props.children}</span>;
          },
          'span':          props => <span {...props.attributes}>{props.children}</span>,
          'div':           props => <div {...props.attributes}>{props.children}</div>,
          'list-item':     props => <li {...props.attributes}>{props.children}</li>,
          'bulleted-list': props => <ul {...props.attributes}>{props.children}</ul>,
          'numbered-list': props => <ol {...props.attributes}>{props.children}</ol>,
          'block-quote':   props => <blockquote {...props.attributes}>{props.children}</blockquote>
        },
        marks: {
          bold: {
            fontWeight: 'bold'
          },
          code: {
            fontFamily: 'monospace',
            backgroundColor: '#eee',
            padding: '3px',
            borderRadius: '4px'
          },
          italic: {
            fontStyle: 'italic'
          },
          underlined: {
             textDecoration: 'underline'
          }
        }
      },
    }
  }

  /* 
   * Returns a new empty block  
   */
  createEmptyBlock = () => { 
    return Block.create({'type': 'span', 'nodes': List([Text.createFromString('​')])});
  }
  /**
   * Insert a block at a specified location or at the current location, and after insertion
   * either move the selection to the next block with offsets or leave selection as-is
   */
  insertBlockAtLocation  = (newStateTransform, block, nextBlock={}, nextBlockStartOffset=0, nextBlockEndOffset=0, location="") => { 
    if (location !== "") {
      //  Need to do something with location
      newStateTransform
        .insertBlock(block);
    } else { 
      newStateTransform
        .insertBlock(block);
    }

    if (nextBlock !== {}) { 
      newStateTransform.moveToRangeOf(nextBlock)
      .moveStart(nextBlockStartOffset)
      .moveEnd(nextBlockEndOffset);
    }

    return newStateTransform
  }

  // Add the plugin to your set of plugins...
  plugins = [
    AutoReplace({
      trigger: '[',
      before: /(#staging)/i,
      transform: (transform, e, data, matches) => {
        const stagingBlock = getNodeById(stagingState.blocks, 'staging')
        const tNode = getNodeById(stagingBlock.nodes, staging.firstSelection);
        const newTrans = this.insertBlockAtLocation(transform, stagingBlock, tNode, staging.selectionAnchorOffset, staging.selectionFocusOffset); 

        return newTrans;
      }
    }),
    AutoReplace({
      trigger: '[',
      before: /(#progression)/i,
      transform: (transform, e, data, matches) => {
        const progressionBlock = getNodeById(progressionState.blocks, 'progression')
        const nextSelection = getNodeById(progressionBlock.nodes, progression.firstSelection);
        const newTrans = this.insertBlockAtLocation(transform, progressionBlock, nextSelection, progression.selectionAnchorOffset, progression.selectionFocusOffset); 

        return newTrans;
      }
    }),
    AutoReplace({
      trigger: 'space',
      before: /(@NAME)/i,
      transform: (transform, e, data, matches) => {
        const newTrans = transform.insertText(`${this.props.data.patient.name} `);
        return newTrans;
      }
    }),
    AutoReplace({
      trigger: 'space',
      before: /(@AGE)/i,
      transform: (transform, e, data, matches) => {
        const newTrans = transform.insertText(`${this.props.data.patient.age} year-old `);
        return newTrans;
      }
    }),
    AutoReplace({
      trigger: 'space',
      before: /(@GENDER)/i,
      transform: (transform, e, data, matches) => {
        const newTrans = transform.insertText(`${this.props.data.patient.gender} `);
        return newTrans;
      }
    })
  ];

  // On change, update the app's React state with the new editor state.
  onChange = (state) => {
    const stagingNode = getNodeById(state.document.nodes, 'staging');
    if(!stagingNode) {
      this.handleStructuredFieldExited(null)
      this.setState({ state })
    } else {
     const stagingKeys = addKeysForNode(stagingNode, []);
     (stagingKeys.includes(state.selection.startKey)) ?  this.handleStructuredFieldEntered('staging') : this.handleStructuredFieldExited('staging');
     this.setState({ state })
    }
  }

  handleStagingTUpdate = (newVal) => {
    this.props.onStagingTUpdate(newVal);
  }

  handleStagingNUpdate = (newVal) => {
    this.props.onStagingNUpdate(newVal);
  }

  handleStagingMUpdate = (newVal) => {
    this.props.onStagingMUpdate(newVal);
  }

  /*
   * Handle updates when we have a new
   */
  handleSummaryUpdate = (itemToBeInserted) => {
    const currentState = this.state.state;
    const state = currentState
        .transform()
        .insertText(itemToBeInserted)
        .apply();
    this.setState({ state: state })
  }

  /*
   * Handle when we enter our current structured field
   */
  handleStructuredFieldEntered = (currentFocus) => {
    this.props.onStructuredFieldEntered(currentFocus);
  }

  /*
   * Handle when we exit our current structured field
   */
  handleStructuredFieldExited = (currentFocus) => {
    this.props.onStructuredFieldExited(currentFocus);
  }
  
  handleSelectionChange = (selectedText) => {
	this.props.onSelectionChange(selectedText);
  }

  /*
   * Handle updates to the current progression status
   */
  handleProgressionStatusUpdate = (newStatusValue, nextNode) => {
    let newProgression = this.state.progression;
    newProgression['status'] = newStatusValue;

    if (newStatusValue.toLowerCase() === "stable" || newStatusValue.toLowerCase() === "progressing") { 

      const stateTransform = this.state.state.transform();
      const newStateSelection = stateTransform.moveToRangeOf(nextNode).apply();

      this.setState({
        progression: newProgression,
        state: newStateSelection
      });

      this.props.onProgressionUpdate(newProgression);
    } else { 
      console.log('doesnt contain status');
      console.log(newProgression.status.split(', '))
    }
  }

  /*
   * Handle updates to the current progression reasons 
   */
  handleProgressionReasonUpdate = (newProgressionReasons, currentNode) => {
    // Find what new values have been added, 
    // validate, and determine if we should proceed.

    // copy old progression and add on 
    let newProgression = this.state.progression;
    const oldProgressionReasons = new Set(this.state.progression['reason']);
    const newProgressionReasonsSet = new Set(newProgressionReasons);

    const uniqueNewReasons = [...newProgressionReasonsSet].filter(x => !oldProgressionReasons.has(x));
    const uniqueValidNewReasons = this.validateProgressionReasons(uniqueNewReasons);
    if (uniqueValidNewReasons.length > 0) { 
      newProgression['reason'] = newProgressionReasons;
      this.setState({
        progression: newProgression, 
      });

      console.log(newProgressionReasons);
      console.log('contains valid value');
      this.props.onProgressionUpdate(newProgression);
    } else { 
      console.log('doesnt contain reason');
      console.log(newProgressionReasons);
    }
  }

  handleProgressionFinish = (state) => { 
    const progressionNode = getNodeById(this.state.state.document.nodes, 'progression')

    this.setState({ 
      state: state.state.transform().collapseToEndOf(progressionNode).insertBlock(this.createEmptyBlock()).apply()
    })
  }

  validateProgressionReasons = (possibleReasons) => { 
    const validReasons = ['physical exam', 'imaging', 'pathology', 'symptoms', 'markers'];
    return possibleReasons.filter(x => validReasons.includes(x));
  }

  handleNewProgression = (newProgression) => {
    this.setState({
      progression: newProgression
    });

    if (newProgression.status === "stable" || newProgression.status === "progressing") { 
      this.props.onNewProgression(newProgression);
      return true;
    } else if (newProgression.reason.length > 0 && this.validateProgressionReasons(newProgression.reason.split(', ')).length > 0){
      this.props.onNewProgression(newProgression);
    } else { 
      return false;
    }
  }
  /**
   * Check if the current selection has a mark with `type` in it.
   */
  handleMarkCheck = (type) => {
    const { state } = this.state;
    return state.marks.some(mark => mark.type === type);
  }

  /**
   * Check if the any of the currently selected blocks are of `type`.
   */
  handleBlockCheck = (type) => {
    const { state } = this.state;
    return state.blocks.some(node => node.type === type);
  }

  /**
   * Handle any changes to the current mark type.
   */
  handleMarkUpdate = (type) =>  {
    let { state } = this.state
    state = state
      .transform()
      .toggleMark(type)
      .apply()
    this.setState({ state });
  }

  /**
   * Handle any changes to the current block type.
   */
  handlBlockUpdate = (type) =>  {
    let { state } = this.state;
    const transform = state.transform();
    const { document } = state;

    // Handle list buttons.
    if (type === 'bulleted-list' || type === 'numbered-list') {
      const isList = this.hasBlock('list-item')
      const isType = state.blocks.some((block) => {
        return !!document.getClosest(block.key, parent => parent.type === type)
      })

      if (isList && isType) {
        transform
          .setBlock(DEFAULT_NODE)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list')
      } else if (isList) {
        transform
          .unwrapBlock(type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list')
          .wrapBlock(type)
      } else {
        transform
          .setBlock('list-item')
          .wrapBlock(type)
      }
    } else {
      // We don't handle any other kinds of block style formatting right now, but if we did it would go here.
    }

    state = transform.apply()
    this.setState({ state });
    
  }

  /* 
   * For a given autocomplete block, use lookup table to find the next block to be selected
   */
  getNextSelectionBlock = (autocompleteBlock, autocompleteId) => {
    const currentAutocompleteOption = this.state.autocompleteOptions.find((element, index, array) => element.label === autocompleteId);
    return getNodeById(autocompleteBlock.nodes, currentAutocompleteOption.firstSelection)
  }

  /* 
   * For a given autocomplete id, use lookup table to find it and retrieve the offsets needed for selection
   */
  getNextSelectionOffsets = (autocompleteId) => {
    const currentAutocompleteOption = this.state.autocompleteOptions.find((element, index, array) => element.label === autocompleteId);
    return [currentAutocompleteOption.selectionAnchorOffset, currentAutocompleteOption.selectionFocusOffset];
  }
  
  /** 
   * Deletes a number of characters corresponding to the number of chars in 
   * the states autocomplete buffer plus one for the dot that triggered it
   */   
  deleteCurrentAutocompleteText = (newStateTransform) => {
      for(const char of this.state.autocompleteText) { 
        newStateTransform.deleteBackward();
      }
      // Delete once more for period
      newStateTransform.deleteBackward();
    return newStateTransform
  }

  /**
   * Inserts the current autocomplete match onto the page
   */
  insertCurrentAutocompleteMatch = () => {
    const autocompleteId = this.state.autocompleteMatches[this.state.currentAutocompleteMatch];
    const currentAutocompleteOption = this.state.autocompleteOptions.find((element, index, array) => element.label === autocompleteId);
    const autocompleteState = Raw.deserialize(currentAutocompleteOption.block,{terse:true});
    const autocompleteBlock = getNodeById(autocompleteState.blocks, autocompleteId);

    let newStateTransform = this.state.state.transform();
    newStateTransform = this.deleteCurrentAutocompleteText(newStateTransform); 
    const nextBlock = this.getNextSelectionBlock(autocompleteBlock, autocompleteId);
    const [startOffset, endOffset] = this.getNextSelectionOffsets(autocompleteId);
    newStateTransform = this.insertBlockAtLocation(newStateTransform, autocompleteBlock, nextBlock, startOffset, endOffset);

    const newState = newStateTransform.apply();
    this.setState({
      currentAutocompleteMatch : null,
      inAutocomplete: false,
      autocompleteText: "",
      autocompleteMatches: [],
      state: newState,
    });
    return newState;
  }

  /**
   * Updates the current autocomplete match based on the new key provided
   */
  updateCurrentAutocompleteMatch = (key) => { 
    this.setState({
      currentAutocompleteMatch: key
    });
  }

  /**
   * Determines new autocomplete matches based on the current 
   * autocomplete text typed
   */
  determineAutocompleteMatches = (autocompleteText) => {
    let matches = []; 
    const regexFromAutocompleteText = new RegExp(autocompleteText, 'i');
    if (autocompleteText !== "") { 
      for (const opt of this.state.autocompleteOptions) { 
        if(opt.label.match(regexFromAutocompleteText))  { 
          matches.push(opt.label);
        }
      }
    } 
    this.setState({ 
      currentAutocompleteMatch: 0
    })
    return matches.length > 5 ? matches.slice(0,5) : matches;
  }

  /** 
   * Deletes a number of characters corresponding to the number of chars in 
   * the states shorthand buffer plus one for the dot that triggered it
   */   
  deleteCurrentShorthandText = (newStateTransform) => {
    for(const char of this.state.shorthandText) { 
      newStateTransform.deleteBackward();
    }
    // Delete once more for period
    newStateTransform.deleteBackward();
    return newStateTransform
  }

  /**
   * Inserts the current shorthand match onto the page
   */
  insertCurrentShorthandMatch = () => {
    const shorthandId = this.state.shorthandMatches[this.state.currentShorthandMatch];
    const currentShorthandOption = this.state.shorthandOptions.find((element, index, array) => element.label === shorthandId);

    let newStateTransform = this.state.state.transform();
    newStateTransform = this.deleteCurrentShorthandText(newStateTransform); 
    newStateTransform = newStateTransform.insertText(currentShorthandOption.value)

    const newState = newStateTransform.apply();
    this.setState({
      currentShorthandMatch : null,
      inShorthand: false,
      shorthandText: "",
      shorthandMatches: [],
      state: newState,
    });
    return newState;
  }

  /**
   * Updates the current shorthand match based on the new key provided
   */
  updateCurrentShorthandMatch = (key) => {
    this.setState({
      currentShorthandMatch: key
    });
  }

  /**
   * Determines new autocomplete matches based on the current 
   * autocomplete text typed
   */
  determineShorthandMatches = (shorthandText) => {
    let matches = []; 
    const regexFromShorthandText = new RegExp(shorthandText, 'i');
    if (shorthandText !== "") { 
      for (const opt of this.state.shorthandOptions) { 
        if(opt.label.match(regexFromShorthandText))  { 
          matches.push(opt.label);
        }
      }
    } 
    this.setState({ 
      currentShorthandMatch: 0
    })
    return matches.length > 5 ? matches.slice(0,5) : matches;
  }

  onSelectionChange = (selection, state) => {
	//console.log(selection.startOffset + " to " + selection.endOffset);
	if (selection.startOffset !== selection.endOffset) {
		this.handleSelectionChange(state.document.getFragmentAtRange(selection).getText());
	} else {
		this.handleSelectionChange(null);
	}
  }
  
  onKeyDown = (event, data, state) => {
    // Continue handling autocompletes    
    if(this.state.inAutocomplete) {
      let newText = "";
      let matches = [];

      switch (event.keyCode) {
        // Left and up move up -- decrease index or wrap
        case 37: 
        case 38:
          event.preventDefault();
          if (this.state.autocompleteMatches.length > 0) { 
            this.setState({
              currentAutocompleteMatch: (this.state.autocompleteMatches.length + (this.state.currentAutocompleteMatch - 1)) % this.state.autocompleteMatches.length,
            });
          }
          break;
        // Right and down move down -- increase index or wrap  
        case 39: 
        case 40:
          event.preventDefault();
          if (this.state.autocompleteMatches.length > 0) { 
            this.setState({
              currentAutocompleteMatch: (this.state.currentAutocompleteMatch + 1) % this.state.autocompleteMatches.length,
            });
          } 
          break;
        case 32: // Deactivate on spacebar 
          this.setState({
            inAutocomplete: false, 
            autocompleteMatches: [],
            autocompleteText: "",
          });
          break;
        case 13: // Handle enter clicks to insert text
          if (this.state.autocompleteMatches.length > 0) {
            event.preventDefault(); 
            return this.insertCurrentAutocompleteMatch();
          }
          break;
        case 8:  // Handle deletions by updating the autocompleteText and suggestions
          const textLength = this.state.autocompleteText.length;
          newText = (textLength > 0) ? this.state.autocompleteText.slice(0, textLength -1) : "" ;
          matches = this.determineAutocompleteMatches(newText);
          this.setState({
              autocompleteText: newText,
              inAutocomplete: (textLength !== 0),
              autocompleteMatches: matches,
          })
          break;
        default: // Continue growing autocompleteText and offering updated suggestions
          newText = this.state.autocompleteText +  String.fromCharCode(event.keyCode);  
          matches = this.determineAutocompleteMatches(newText);
          
          this.setState({
              autocompleteText: newText,
              autocompleteMatches: matches,
          })
          break;
      }
    } else if (this.state.inShorthand) {
      let newText = "";
      let matches = [];

      switch (event.keyCode) {
        // Left and up move up -- decrease index or wrap
        case 37: 
        case 38:
          event.preventDefault();
          if (this.state.shorthandMatches.length > 0) { 
            this.setState({
              currentShorthandMatch: (this.state.shorthandMatches.length + (this.state.currentShorthandMatch - 1)) % this.state.shorthandMatches.length,
            });
          }
          break;
        // Right and down move down -- increase index or wrap  
        case 39: 
        case 40:
          event.preventDefault();
          if (this.state.shorthandMatches.length > 0) { 
            this.setState({
              currentShorthandMatch: (this.state.currentShorthandMatch + 1) % this.state.shorthandMatches.length,
            });
          } 
          break;
        case 32: // Deactivate on spacebar 
          this.setState({
            inShorthand: false, 
            shorthandMatches: [],
            shorthandText: "",
          });
          break;
        case 13: // Handle enter clicks to insert text
          if (this.state.shorthandMatches.length > 0) {
            event.preventDefault(); 
            return this.insertCurrentShorthandMatch();
          }
          break;
        case 8:  // Handle deletions by updating the shorthandText and suggestions
          const textLength = this.state.shorthandText.length;
          newText = (textLength > 0) ? this.state.shorthandText.slice(0, textLength -1) : "" ;
          matches = this.determineShorthandMatches(newText);
          this.setState({
              shorthandText: newText,
              inShorthand: (textLength !== 0),
              shorthandMatches: matches,
          })
          break;
        default: // Continue growing ShorthandText and offering updated suggestions
          newText = this.state.shorthandText +  String.fromCharCode(event.keyCode);  
          matches = this.determineShorthandMatches(newText);
          
          this.setState({
              shorthandText: newText,
              shorthandMatches: matches,
          })
          break;
      }
    } else { 
       if (data.isShift) { 
        let newState;
        let closestDOMElement;
        let menuEl;
        let offset;
        switch (data.key) {
          case '2': 
            newState = this.state.state.transform().setBlockAtRange(this.state.state.selection,{data: {"id": "autocomplete-block"}}).apply()
            closestDOMElement = window.document.querySelector(`[data-key="${this.state.state.anchorKey}"]`)
            menuEl = window.document.getElementsByClassName("shorthand-menu")[0]
            offset = getOffsets(menuEl, 'top left', closestDOMElement, 'bottom right')
            menuEl.style.top = `${offset.top}px`
            menuEl.style.left = `${offset.left}px`
            this.setState({
              state: newState, 
              inShorthand: true,
              shorthandText: ""
            });
            return;
          case '3': 
            // Trigger autocomplete mode if a '#' is typed 
            newState = this.state.state.transform().setBlockAtRange(this.state.state.selection,{data: {"id": "autocomplete-block"}}).apply()
            closestDOMElement = window.document.querySelector(`[data-key="${this.state.state.anchorKey}"]`)
            menuEl = window.document.getElementsByClassName("autocomplete-menu")[0]
            offset = getOffsets(menuEl, 'top left', closestDOMElement, 'bottom right')
            menuEl.style.top = `${offset.top}px`
            menuEl.style.left = `${offset.left}px`
              this.setState({
              state: newState, 
              inAutocomplete: true,
              autocompleteText: ""
            });
          default:
            return; 
        } 
      } else if (data.isMod) { 
        // Handle ctrl-b and other shortkeys for format switching 
        let mark
        switch (data.key) {
          case 'b':
            mark = 'bold'
            break
          case 'i':
            mark = 'italic'
            break
          case 'u':
            mark = 'underlined'
            break
          case '`':
            mark = 'code'
            break
          default:
            return
        }
        event.preventDefault()
        return state
          .transform()
          .toggleMark(mark)
          .apply()
      } else if (event.keyCode === 13 && !(state.blocks.some(node => (node.type === "list-item") || (node.type ==="bulleted-list") || (node.type ==="numbered-list")))) {
          // Handle new lines in the case where we aren't in a list 
          event.preventDefault();
          return state
          .transform()
          // Paste a block containing a zero width space 
          .insertBlock(Block.create({'type': 'paragraph-span', 'nodes': List([Text.createFromString('​')])}))
          .apply();
      } else {
        // Search all nodes to find if structured nodes that need checking 
        for(const parentNode of state.document.nodes) { 
          // Handle staging structured data 
          const tNode = getNodeById(parentNode.nodes, 't-staging');
          const nNode = getNodeById(parentNode.nodes, 'n-staging');
          const mNode = getNodeById(parentNode.nodes, 'm-staging');
          const stagingNode = getNodeById(state.document.nodes, 'staging');

          if(tNode && nNode && mNode) { 
            const tKeys = addKeysForNode(tNode, []);
            const nKeys = addKeysForNode(nNode, []);
            const mKeys = addKeysForNode(mNode, []);
            if (tKeys.includes(state.selection.startKey)) { 
              if(event.keyCode >= 48 && event.keyCode <=57) {
                const val = event.keyCode - 48;
                this.handleStagingTUpdate('T' + val.toString());

                event.preventDefault()
                return state
                  .transform()
                  .moveToRangeOf(tNode)
                  .moveStart(1)
                  .moveEnd(-1)
                  .insertText(String.fromCharCode(event.keyCode))
                  .moveToRangeOf(nNode)
                  .moveStart(1)
                  .moveEnd(-1)
                  .apply();
              } 
            } else if (nKeys.includes(state.selection.startKey)) { 
              if(event.keyCode >= 48 && event.keyCode <=57) {
                const val = event.keyCode - 48;
                this.handleStagingNUpdate('N' + val.toString());

                event.preventDefault()
                return state
                  .transform()
                  .moveToRangeOf(nNode)
                  .moveStart(1)
                  .moveEnd(-1)
                  .insertText(String.fromCharCode(event.keyCode))
                  .moveToRangeOf(mNode)
                  .moveStart(1)
                  .moveEnd(-1)
                  .apply();
              } 
            } else if (mKeys.includes(state.selection.startKey))  { 
              if(event.keyCode >= 48 && event.keyCode <=57) {
                const val = event.keyCode - 48;
                this.handleStagingMUpdate('M' + val.toString());
                // Create a block with a zero-width space 
                event.preventDefault()
                return state
                  .transform()
                  .moveToRangeOf(mNode)
                  .moveStart(1)
                  .moveEnd(-1)
                  .insertText(String.fromCharCode(event.keyCode))
                  .collapseToEndOf(stagingNode)
                  .insertBlock(this.createEmptyBlock())
                  .apply();
              } 
            }
          }
        } 
      }
    }
  }
  

  /**
   * Lifecycle method that triggers after updates to the component
   */
  componentDidUpdate = (prevProps, prevState) => { 

    // Handle progression structured data
    for(const parentNode of this.state.state.document.nodes) {

      const curProgressionStatusNode = getNodeById(parentNode.nodes, 'progression-value');
      const curProgressionReasonNode = getNodeById(parentNode.nodes, 'progression-cause');     
      if (curProgressionStatusNode && curProgressionReasonNode) {
        let prevProgressionStatusNode = null; 
        let prevProgressionReasonNode = null;
        // Check to see if these nodes exists in old set
        for(const parentNode of prevState.state.document.nodes) {
          prevProgressionStatusNode = !!(getNodeById(parentNode.nodes, 'progression-value')) ? getNodeById(parentNode.nodes, 'progression-value') : prevProgressionStatusNode;
          prevProgressionReasonNode = !!(getNodeById(parentNode.nodes, 'progression-cause')) ? getNodeById(parentNode.nodes, 'progression-cause') : prevProgressionReasonNode;
        }          
        // If both of these nodes are new, make a new progression value 
        if (! (prevProgressionStatusNode || prevProgressionReasonNode)) {
          this.handleNewProgression({
            id: Date.now(),
            status: "",
            reason: [],
            startDate: moment(new Date()),
            endDate: moment('2012-02-11')
          });
        } else { 
          // If these nodes are old, update progression value if applicable
          if (prevProgressionStatusNode.text !== curProgressionStatusNode.text) {
            // Handle progression status update and pass off next node
            this.handleProgressionStatusUpdate(curProgressionStatusNode.text, curProgressionReasonNode) 
          } 
          if (prevProgressionReasonNode.text !== curProgressionReasonNode.text) {
            console.log(curProgressionReasonNode.text[curProgressionReasonNode.text.length - 1])
            if (curProgressionReasonNode.text[curProgressionReasonNode.text.length - 1] === "]") {

              this.handleProgressionFinish(prevState);
            }  else { 
              this.handleProgressionReasonUpdate(curProgressionReasonNode.text.split(', '), curProgressionReasonNode) 
            }
          }  
        }
      }
    }
  }

  // This gets called when the before the component receives new properties
  componentWillReceiveProps = (nextProps) => {

    if (this.props.itemToBeInserted !== nextProps.itemToBeInserted) {
      this.handleSummaryUpdate(nextProps.itemToBeInserted);
    }

    // Check if staging block exists in the editor
    const stagingNode = getNodeById(this.state.state.document.nodes, 'staging');

    // If it exists, populate the fields with the updated staging values
    if (stagingNode) {
      for(const parentNode of this.state.state.document.nodes) {
        const tNode = getNodeById(parentNode.nodes, 't-staging');
        const nNode = getNodeById(parentNode.nodes, 'n-staging');
        const mNode = getNodeById(parentNode.nodes, 'm-staging');

        // Set t value
        if(tNode && this.props.tumorSize !== nextProps.tumorSize) {
            const currentState = this.state.state;
            const state = currentState
                .transform()
                .moveToRangeOf(tNode)
                .moveEnd(-1)
                .deleteForward()
                .insertText(nextProps.tumorSize)
                .apply();
            this.setState({ state: state })
        }

        // Set n value
        if(nNode && this.props.nodeSize !== nextProps.nodeSize) {
          const currentState = this.state.state;
          const state = currentState
              .transform()
              .moveToRangeOf(nNode)
              .moveEnd(-1)
              .deleteForward()
              .insertText(nextProps.nodeSize)
              .apply();
          this.setState({ state: state })
        }

        // Set m value
        if(mNode && this.props.metastasis !== nextProps.metastasis) {
          const currentState = this.state.state;
          const state = currentState
              .transform()
              .moveToRangeOf(mNode)
              .moveEnd(-1)
              .deleteForward()
              .insertText(nextProps.metastasis)
              .apply();
          this.setState({ state: state })
        }
      }
    }
  }

  /**
   * Render the dropdown of suggestions.
   */
  renderDropdown = () => { 
    return (
      <div className="menu autocomplete-menu">
        {this.state.autocompleteMatches.map((match, index) => {
          const isActive = (this.state.currentAutocompleteMatch === index); 

          return (
              <div className="menu-item" key={index} data-active={isActive} onMouseOver={ () => { this.updateCurrentAutocompleteMatch(index)}} onClick={() => this.insertCurrentAutocompleteMatch()}>
                {match}
              </div>
          );}
        )}
      </div> 
    )
  }

  /**
   * Render the dropdown of shorthand suggestions.
   */
  renderShorthandDropdown = () => { 
    return (
      <div className="menu shorthand-menu">
        {this.state.shorthandMatches.map((match, index) => {
          const isActive = (this.state.currentShorthandMatch === index); 

          return (
              <div className="menu-item" key={index} data-active={isActive} onMouseOver={ () => { this.updateCurrentShorthandMatch(index)}} onClick={() => this.insertCurrentShorthandMatch()}>
                {match}
              </div>
          );}
        )}
      </div> 
    )
  }

  /**
   * Render the editor, toolbar and dropdown when needed.
   */
  render = () => {
    return (
      <div className="MyEditor-root">
        <EditorToolbar
          onMarkCheck={this.handleMarkCheck} 
          onBlockCheck={this.handleBlockCheck}

          onMarkUpdate={this.handleMarkUpdate} 
          onBlockUpdate={this.handleBlockUpdate}
          patient={this.props.patient}
        />
        {this.renderDropdown()}
        {this.renderShorthandDropdown()}
        <Editor
		  placeholder={this.placeholder}
          schema={this.state.schema}
          state={this.state.state}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
		  onSelectionChange={this.onSelectionChange}
          plugins={this.plugins}
        />
      </div>
    )
  }
}

export default MyEditor;