import React, { Component } from 'react';
import { connect } from 'react-redux';
import RegistrationModal from 'Components/RegistrationModal';
import FA from 'react-fontawesome';
import Button from '@material-ui/core/Button';
import { StopRegistrationSession } from '../Actions';

class NotAuthorized extends Component {
  endRegistration = () => {
    this.props.stopRegistrationSession();
    this.props.history.push('/');
  };
  gws = () => {
    let groupName = this.props.groupNameBase.slice(0, -1);
    window.open(`https://groups.uw.edu/group/${groupName}`, '_blank');
  };
  render() {
    return (
      <div>
        <h1>Not Authorized</h1>
        <div>
          You are not authorized to configure registrations for &nbsp;
          <strong>{this.props.groupNameBase.slice(0, -1)}</strong>
          <br />
          To register users for this group your UWNetID needs to be a member of this group.
        </div>
        <br />
        <RegistrationModal openButtonText="Home" dialogTitle="Return Home" endRegistration={this.endRegistration} openButtonColor="primary" cancelButtonText="Cancel" approveButtonText="Back to Home">
          <p>Are you sure you want to log out and return home?</p>
        </RegistrationModal>
        &nbsp;
        <Button color="primary" variant="raised" onClick={() => this.gws()}>
          <FA name="group" />
          &nbsp;Groups WS
        </Button>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  groupNameBase: state.groupNameBase
});
const mapDispatchToProps = dispatch => {
  return {
    stopRegistrationSession: () => dispatch(StopRegistrationSession())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NotAuthorized);
