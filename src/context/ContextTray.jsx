import React, { Component } from 'react';
import PropTypes from 'prop-types';

import TemplateViewModeContent from './TemplateViewModeContent'
import ShortcutViewModeContent from './ShortcutViewModeContent'
import './ContextTray.css';

export default class ContextTray extends Component {
    //these are the possible view mode constants
    TEMPLATE_VIEW = 0;
    SHORTCUT_VIEW = 1;
    constructor(props) {
        super(props);

        this.state = {
            // viewMode keeps track of which context is active
            // 0 when Templates are selected. 1 when Patient is selected
            // In editor, viewMode is incremented by 1 for each context added (i.e @condition, #disease status)
            viewMode: this.SHORTCUT_VIEW,
        };
    }

    handleTemplateSectionClick = () => this.setState({ 
        viewMode: this.TEMPLATE_VIEW 
    })
    
    handlePatientSectionClick = () => this.setState({ 
        viewMode: this.SHORTCUT_VIEW 
    })

    render() {
        const { viewMode } = this.state;

        return (
            <div className="context-tray">
                <section>
                    <div className="view-mode-section-menu">
                    <div
                        className={`view-mode-section-item${viewMode === this.TEMPLATE_VIEW ? ' selected' : ''}`}
                        onClick={this.handleTemplateSectionClick}
                    >
                        TEMPLATES
                    </div>                        

                    <div
                        className={`view-mode-section-item${viewMode === this.SHORTCUT_VIEW ? ' selected' : ''}`}
                        onClick={this.handlePatientSectionClick}
                    >
                        SHORTCUTS
                    </div>
                    </div>
                </section>

                {viewMode === this.TEMPLATE_VIEW &&
                    <TemplateViewModeContent
                        onShortcutClicked={this.props.onShortcutClicked}
                        patient={this.props.patient}
                    />
                }

                {viewMode === this.SHORTCUT_VIEW &&
                    <ShortcutViewModeContent
                        contextManager={this.props.contextManager}
                        handleClick={this.handleShortcutClick}
                        onShortcutClicked={this.props.onShortcutClicked}
                        shortcutManager={this.props.shortcutManager}
                    />
                }
            </div>
        );
    }
}

ContextTray.proptypes = {
    contextManager: PropTypes.object.isRequired,
    onShortcutClicked: PropTypes.func.isRequired,
    patient: PropTypes.object.isRequired,
    shortcutManager: PropTypes.object.isRequired,
}
