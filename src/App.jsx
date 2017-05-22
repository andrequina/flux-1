// React Imports:
import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-flexbox-grid';
// Material UI components:
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
// Application components:
import AppTopWithDrawer from './AppTopWithDrawer';
import DemographicSummary from './DemographicSummary';
import ClinicalNotes2 from './ClinicalNotes2';
import DataSummary from './DataSummary';
import FormsPanel from './FormsPanel';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      HER2Status: '+',
      ERStatus:   '+',
      PRStatus:   '+',
      SummaryKeyData: ''

    };
    this.changeHER2Status = this.changeHER2Status.bind(this);
    this.changeERStatus = this.changeERStatus.bind(this);
    this.changePRStatus = this.changePRStatus.bind(this);
    this.handleSummaryUpdate = this.handleSummaryUpdate.bind(this);
  }

  changeHER2Status(newStatus) {
    (newStatus !== "") && this.setState({
      HER2Status: newStatus
    })
  }

  changeERStatus(newStatus) {
    (newStatus !== "") && this.setState({
      ERStatus: newStatus
    })
  }

  changePRStatus(newStatus) {
    (newStatus !== "") && this.setState({
      PRStatus: newStatus
    })
  }

  componentDidUpdate(a, b) {
    console.log('did update')
    console.log(a)
    console.log(b)
    console.log(this)
  }
  handleSummaryUpdate(itemString, subItemString) {

    (itemString !== "") && (subItemString !== "") && this.setState({
      SummaryKeyData: itemString + ", " + subItemString
    });

    (itemString !== "") && (subItemString === "") && this.setState({
      SummaryKeyData: itemString
    });

  }
  render() {
    return (
      <MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
        <div className="App">
          <AppTopWithDrawer />
          <Grid className="App-content" fluid>
            <Row>
              <Col xs={12}>
                <DemographicSummary />
              </Col>
            </Row>
            <Row center="xs">
              <Col sm={3}>
                <DataSummary
                  onHER2StatusChange={this.changeHER2Status}
                  onERStatusChange={this.changeERStatus}
                  onPRStatusChange={this.changePRStatus}
                  HER2Status={this.state.HER2Status}
                  ERStatus={this.state.ERStatus}
                  PRStatus={this.state.PRStatus}
                  onSummaryItemSelected={this.handleSummaryUpdate}
                />
              </Col>
              <Col sm={6}>
                <ClinicalNotes2
                  onHER2StatusChange={this.changeHER2Status}
                  onERStatusChange={this.changeERStatus}
                  onPRStatusChange={this.changePRStatus}
                  HER2Status={this.state.HER2Status}
                  ERStatus={this.state.ERStatus}
                  PRStatus={this.state.PRStatus}
                  itemToBeEntered = {this.state.SummaryKeyData}
                />
              </Col>
              <Col sm={3}>
                <FormsPanel />
              </Col>
            </Row>
          </Grid>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
