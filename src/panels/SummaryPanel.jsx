import React, {Component} from 'react';
import PropTypes from 'prop-types';
import DataSummaryPanel from '../summary/DataSummaryPanel';
import TimelinePanel from '../timeline/TimelinePanel';
import Minimap from '../lib/react-minimap/react-minimap.js';
import '../lib/react-minimap/react-minimap.css'
import './SummaryPanel.css';

class SummaryPanel extends Component { 
    render () { 
        // The class associated with 
        const minimapItemClass = "section-panel";
        return (
            <Minimap 
                selector={`.summary-section .${minimapItemClass}`}
                className="fitted-panel"
                childComponentClassName="padded-panel"
                width={80}
                isFullHeight={true}
            >   
                <div id="summary-subpanel">
                    <div className="summary-section">
                        <h1 className="panel-heading">
                            Summary
                        </h1>
                        <DataSummaryPanel
                            className={minimapItemClass}
                            isWide={this.props.isWide}
                            patient={this.props.appState.patient}
                            condition={this.props.appState.condition}
                            summaryMetadata={this.props.appState.summaryMetadata}
                            onItemClicked={this.props.handleSummaryItemSelected}
                            allowItemClick={true}
                        />
                    </div>
                    <div className="summary-section"> 
                        <h1 className="panel-heading">
                            Timeline 
                        </h1>
                        <TimelinePanel
                            className={minimapItemClass}
                            isWide={this.props.isWide}
                            patient={this.props.appState.patient} 
                            condition={this.props.appState.condition}
                        />
                    </div>
                </div> 
            </Minimap>
        );
    }
}

SummaryPanel.proptypes = { 
    isWide: PropTypes.bool.isRequired,
    possibleClinicalEvents: PropTypes.array.isRequired,
    appState: PropTypes.shape({
        patient: PropTypes.object.isRequired,
        condition: PropTypes.object,
        summaryMetadata: PropTypes.object.isRequired
    }).isRequired,
    itemInserted: PropTypes.func.isRequired,
    handleSummaryItemSelected: PropTypes.func.isRequired
}

export default SummaryPanel;