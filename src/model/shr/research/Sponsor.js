import { setPropertiesFromJSON } from '../../json-helper';

/**
 * Generated class for shr.research.Sponsor.
 */
class Sponsor {

  /**
   * Get the value (aliases organization).
   * @returns {Reference} The shr.entity.Organization reference
   */
  get value() {
    return this._organization;
  }

  /**
   * Set the value (aliases organization).
   * This field/value is required.
   * @param {Reference} value - The shr.entity.Organization reference
   */
  set value(value) {
    this._organization = value;
  }

  /**
   * Set the value (aliases organization) and return 'this' for chaining.
   * This field/value is required.
   * @param {Reference} value - The shr.entity.Organization reference
   * @returns {Sponsor} this.
   */
  withValue(value) {
    this.value = value; return this;
  }

  /**
   * Get the shr.entity.Organization reference.
   * @returns {Reference} The shr.entity.Organization reference
   */
  get organization() {
    return this._organization;
  }

  /**
   * Set the shr.entity.Organization reference.
   * This field/value is required.
   * @param {Reference} organization - The shr.entity.Organization reference
   */
  set organization(organization) {
    this._organization = organization;
  }

  /**
   * Set the shr.entity.Organization reference and return 'this' for chaining.
   * This field/value is required.
   * @param {Reference} organization - The shr.entity.Organization reference
   * @returns {Sponsor} this.
   */
  withOrganization(organization) {
    this.organization = organization; return this;
  }

  /**
   * Deserializes JSON data to an instance of the Sponsor class.
   * The JSON must be valid against the Sponsor JSON schema, although this is not validated by the function.
   * @param {object} json - the JSON data to deserialize
   * @returns {Sponsor} An instance of Sponsor populated with the JSON data
   */
  static fromJSON(json={}) {
    const inst = new Sponsor();
    setPropertiesFromJSON(inst, json);
    return inst;
  }
  /**
   * Serializes an instance of the Sponsor class to a JSON object.
   * The JSON is expected to be valid against the Sponsor JSON schema, but no validation checks are performed.
   * @returns {object} a JSON object populated with the data from the element
   */
  toJSON() {
    const inst = { 'EntryType': { 'Value' : 'http://standardhealthrecord.org/spec/shr/research/Sponsor' } };
    if (this.value != null) {
      inst['Value'] = typeof this.value.toJSON === 'function' ? this.value.toJSON() : this.value;
    }
    return inst;
  }
}
export default Sponsor;
