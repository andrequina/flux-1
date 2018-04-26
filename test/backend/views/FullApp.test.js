import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';
import { expect } from 'chai'

import { FullApp } from '../../../src/containers/FullApp';
import SummaryHeader from '../../../src/summary/SummaryHeader';
import TargetedDataSection from '../../../src/summary/TargetedDataSection';
import Button from '../../../src/elements/Button';
import SummaryMetadata from '../../../src/summary/SummaryMetadata';
import VisualizerManager from '../../../src/summary/VisualizerManager';
import TabularNameValuePairsVisualizer from '../../../src/summary/NarrativeNameValuePairsVisualizer';

Enzyme.configure({ adapter: new Adapter() });

describe('UpdateErrors', function () {
    it('should set state.errors to equal the provided argument', function () {
        const wrapper = shallow(<FullApp display='test' />);
        const emptyErrors = [];
        wrapper.instance().updateErrors(emptyErrors);
        expect(wrapper.state('errors'))
            .to.be.an('array')
            .and.to.be.empty;

        const newErrors = ["anything", "anything else"];
        wrapper.instance().updateErrors(newErrors);
        expect(wrapper.state('errors'))
            .to.equal(newErrors);
    });
});

describe('setFullAppState', function() {
    it('sets the state on the component', function() {
        const wrapper = shallow(<FullApp display='test'/>);

        wrapper.instance().setFullAppState('testKey', 'testValue');
        expect(wrapper.state('testKey'))
            .to.eq('testValue');
    });
});

// describe('SummaryHeader', function() {
//     it('View buttons update state', function() {
//         const wrapper = shallow(<SummaryHeader />);

//         // // Initial state
//         // expect(wrapper.state('layout'))
//         //     .to.eq('none');

//         // // Clicking a View button changes the state
//         // const leftView = wrapper.find(Button).find('#left-collapsed-layout-button');
//         // leftView.simulate('click');
//         // expect(wrapper.state('layout'))
//         //   .to.eq('left');
//     });
// });

describe('TargetedDataControl', function() {
    it('noteDisplayMode buttons update state', function() {
        const summaryMetadata = new SummaryMetadata();
        // Look for the first NameValuePair section which should be Summary. Assumes it does not have a defaultVisualizer property
        const section = summaryMetadata.hardCodedMetadata["http://snomed.info/sct/408643008"].sections.find((section) => {
            return (section.type === "NameValuePairs");
        });
        let options = [];
        if (section.type === "NameValuePairs") {
            options.push('tabular');
            if (section.narrative) {
                options.push('narrative');
            }
        } else if (section.type === "Events") {
            options.push('timeline');
        }
        const defaultOrTabular = options.length > 0 ? options[0] : 'tabular';

        const visualizerManager = new VisualizerManager()
        const wrapper = shallow(<TargetedDataSection section={section} type={section.type} visualizerManager={visualizerManager} isWide={false} clinicalEvent='post-encounter'/>);

        // Initial state
        expect(wrapper.state('defaultVisualizer'))
            .to.eq(defaultOrTabular);
        expect(wrapper.state('chosenVisualizer'))
            .to.be.null;

        // Clicking the non-default note display button changes the state
        const narrativeIcon = wrapper.find('.right-icons').find(Button).find('#narrative');
        narrativeIcon.simulate('click');
        expect(wrapper.state('chosenVisualizer'))
            .to.eq('narrative');
    });
});
describe('TargetedDataControl - correct default visualizer Medications', function() {
    it('correct default visualizer', function() {
        const summaryMetadata = new SummaryMetadata();
        // Look for the first NameValuePair section which should be Summary. Assumes it does not have a defaultVisualizer property
        const section = summaryMetadata.hardCodedMetadata["http://snomed.info/sct/408643008"].sections.find((section) => {
            return (section.type === "Medications");
        });
        const expectedDefault = 'chart';

        const visualizerManager = new VisualizerManager()
        const wrapper = shallow(<TargetedDataSection section={section} type={section.type} visualizerManager={visualizerManager} isWide={false} clinicalEvent='pre-encounter'/>);

        // Initial state
        expect(wrapper.state('defaultVisualizer'))
            .to.eq(expectedDefault);
        expect(wrapper.state('chosenVisualizer'))
            .to.be.null;
    });
});
