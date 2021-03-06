import { setPropertiesFromJSON } from '../../json-helper';

/**
 * Generated class for shr.core.RecurrenceRange.
 */
class RecurrenceRange {

  /**
   * Get the choice value; one of: shr.core.TimePeriod, shr.core.NumberOfRepeats.
   * @returns {(TimePeriod|NumberOfRepeats)} The choice value; one of: shr.core.TimePeriod, shr.core.NumberOfRepeats
   */
  get value() {
    return this._value;
  }

  /**
   * Set the choice value; one of: shr.core.TimePeriod, shr.core.NumberOfRepeats.
   * This field/value is required.
   * @param {(TimePeriod|NumberOfRepeats)} value - The choice value; one of: shr.core.TimePeriod, shr.core.NumberOfRepeats
   */
  set value(value) {
    this._value = value;
  }

  /**
   * Set the choice value; one of: shr.core.TimePeriod, shr.core.NumberOfRepeats and return 'this' for chaining.
   * This field/value is required.
   * @param {(TimePeriod|NumberOfRepeats)} value - The choice value; one of: shr.core.TimePeriod, shr.core.NumberOfRepeats
   * @returns {RecurrenceRange} this.
   */
  withValue(value) {
    this.value = value; return this;
  }

  /**
   * Deserializes JSON data to an instance of the RecurrenceRange class.
   * The JSON must be valid against the RecurrenceRange JSON schema, although this is not validated by the function.
   * @param {object} json - the JSON data to deserialize
   * @returns {RecurrenceRange} An instance of RecurrenceRange populated with the JSON data
   */
  static fromJSON(json={}) {
    const inst = new RecurrenceRange();
    setPropertiesFromJSON(inst, json);
    return inst;
  }
  /**
   * Serializes an instance of the RecurrenceRange class to a JSON object.
   * The JSON is expected to be valid against the RecurrenceRange JSON schema, but no validation checks are performed.
   * @returns {object} a JSON object populated with the data from the element
   */
  toJSON() {
    const inst = { 'EntryType': { 'Value' : 'http://standardhealthrecord.org/spec/shr/core/RecurrenceRange' } };
    if (this.value != null) {
      inst['Value'] = typeof this.value.toJSON === 'function' ? this.value.toJSON() : this.value;
    }
    return inst;
  }
}
export default RecurrenceRange;
