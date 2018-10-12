import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import FA from 'react-fontawesome';
import Subgroup from 'Components/Subgroup';
import { connect } from 'react-redux';
import RegistrationModal from 'Components/RegistrationModal';
import EndRegistrationModal from 'Components/EndRegistrationModal';
import ConfigOptions from 'Components/ConfigOptions';
import { UpdateGroupName, LoadSubgroups, DestroySubgroup, LoadUsers, CreateGroup, CheckAuthentication, StartRegistrationSession, StopRegistrationSession, ToggleNetIDAllowed } from '../Actions';

class Configure extends Component {
    constructor(props) {
        super(props);
        this.state = { newSubgroup: "", loadingSubGroups: false, loadingConfigPage: true, invalidSubgroup: false, privateGroup: true };
    }
    async componentWillMount() {
        if(!this.props.authenticated && !this.props.development) {
            await this.props.checkAuth();
            if(!this.props.authenticated) {
                return window.location = "/login?returnUrl=/config";
            }

            if(!this.props.iaaAuth)
            {
                return window.location = this.props.iaaCheck;
            }
        }
        this.setState({groupName: this.props.groupName});
    }
    validateGroupString(groupName) {
        var RegExpression = /^[a-zA-Z0-9\s]*$/; 
        if(RegExpression.test(groupName) && groupName.length > 2) {
            return true;
        }
        return false;
    }
    generateGroupName(groupString) {
        groupString = groupString.replace(/\s+/g, '-').toLowerCase();
        return this.props.groupNameBase + groupString;
    }
    loadSubGroups = async () => {
        this.setState({loadingSubGroups: true});
        await this.props.loadSubgroups(this.props.groupName);
        this.setState({loadingSubGroups: false});
    };

    handleChange = e => {
        this.setState({[e.target.name]: e.target.value});
        if(e.target.name === "newSubgroup") {
            this.setState({invalidSubgroup: !this.validateGroupString(e.target.value)})
        }
    }

    createSubgroup = async e => {
        e.preventDefault();
        if(this.validateGroupString(this.state.newSubgroup)) {
            this.setState({"creatingGroup": true });
            let success = await this.props.createGroup(this.generateGroupName(this.state.newSubgroup), this.state.privateGroup);
            this.setState({"creatingGroup": false, "newSubgroup": "", "privateGroup": true });
            if(success) {
                this.props.loadSubgroups(this.props.groupName);
                this.props._addNotification("Registration Group Created", `Successfully created registration group: ${this.state.newSubgroup}`)
            } else {
                this.props._addNotification("Create Registration Group Failed", "Group creation failed, does this group already exist?");
            }
        } else {
            this.props._addNotification("Create Registration Group Failed", "Group name can only contain numbers, letters and spaces.");
        }
    }

    updateGroupName = async groupName => {
        await this.props.updateGroupName(groupName);
        this.props.loadUsers(groupName);
        this.props._addNotification("Change Selected Group", `Selected group successfully changed to: ${this.displayGroupName(groupName)}`, "success");
    }
    displayGroupName = groupName => {
        return groupName.replace(this.props.groupNameBase, "").replace(/-/g, ' ');
    }
    startRegistration = async () => {
        await this.props.startRegistrationSession(this.props.groupName, this.props.netidAllowed);
        this.props.history.push("/register");
    }

    endRegistration = async () => {
        await this.props.stopRegistrationSession();
        this.props.history.push("/");
    }

    render() {
        let canStartRegistration = this.props.groupName.length > 0;
        return (
            <div>
                <h1>Configure</h1>
                <RegistrationModal confirmCallback={this.startRegistration} openButtonDisabled={!canStartRegistration} /> &nbsp;
                <EndRegistrationModal confirmCallback={this.endRegistration} /> &nbsp;
                <ConfigOptions netidAllowed={this.props.netidAllowed} handleChange={this.props.toggleNetIDAllowed} />
                <div className="subgroupList">
                    <h2>Subgroups <FA name="refresh" onClick={this.loadSubGroups} spin={this.state.loadingSubGroups} /></h2>
                    <div className="subgroupTable">
                        {
                            this.props.subgroups.map(subgroup => {
                                return <Subgroup key={subgroup.id} subgroup={subgroup} 
                                      deleteCallback={this.props.destroySubgroup} selectedGroup={this.props.groupName} 
                                      updateGroupName={this.updateGroupName} 
                                      groupNameBase={this.props.groupNameBase}
                                      displayGroupName={this.displayGroupName}
                                    />
                            })
                        }
                    </div>
                </div>
                <div className="createGroupForm">
                    <form className="form" onSubmit={this.createSubgroup}>
                        <label htmlFor={this.props.itemName} className="configLabel">{this.props.itemName}</label>
                        { this.state.invalidSubgroup && this.state.newSubgroup.length > 2 && <div className="subgroupError">Registration groups must be longer than 2 characters and can only contain letters, numbers and spaces.</div>}
                        <input type="text" className="newSubgroup" 
                            name="newSubgroup"
                            onChange={this.handleChange}
                            value={this.state.newSubgroup}
                            disabled={this.state.creatingGroup}
                            placeholder="Group Name: letters, numbers and spaces"
                        />
                        <Button disabled={this.state.creatingGroup || this.state.newSubgroup.length < 3} variant="raised" color="primary" type="submit">
                            {this.state.creatingGroup ? <span><FA name="spinner" spin={true} /> Creating</span> : "Create New Subgroup"}
                        </Button>
                        <span className="privateGroupToggle">
                            <input type="checkbox" id="privateGroup" onChange={() => {this.setState({privateGroup: !this.state.privateGroup})}} checked={this.state.privateGroup} /> 
                            <label htmlFor="privateGroup">Private Group</label>
                        </span>
                    </form>
                </div>
            </div>
        )
    }
}

const mapStateToProps = state => ({
   groupName: state.groupName,
   subgroups: state.subgroups,
   authenticated: state.authenticated,
   development: state.development,
   iaaAuth: state.iaaauth,
   iaaCheck: state.iaacheck,
   groupNameBase: state.groupNameBase,
   netidAllowed: state.netidAllowed
});
const mapDispatchToProps = dispatch => {
    return {
        updateGroupName: groupName => dispatch(UpdateGroupName(groupName)),
        loadSubgroups: groupName => dispatch(LoadSubgroups(groupName)),
        destroySubgroup: subgroup => dispatch(DestroySubgroup(subgroup)),
        loadUsers: group => dispatch(LoadUsers(group)),
        createGroup: (group, privateGroup) => dispatch(CreateGroup(group, privateGroup)),
        checkAuth: () => dispatch(CheckAuthentication()),
        startRegistrationSession: (groupName, netidAllowed) => dispatch(StartRegistrationSession(groupName, netidAllowed)),
        stopRegistrationSession: () => dispatch(StopRegistrationSession()),
        toggleNetIDAllowed: () => dispatch(ToggleNetIDAllowed())
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Configure);