import rp from 'request-promise';
import fs from 'fs';
import { FilterModel } from '../utils/helpers';

const GROUPSBASEURL = process.env.GROUPSBASEURL;
const CERTIFICATEFILE = process.env.CERTIFICATEFILE;
const PASSPHRASEFILE = process.env.PASSPHRASEFILE;
const INCOMMONFILE = process.env.INCOMMONFILE;
const GROUPDISPLAYNAME = process.env.GROUPDISPLAYNAME;
const GROUPADMINS = process.env.GROUPADMINS ? process.env.GROUPADMINS.split(',') : [];

const options = {
    method: 'GET',
    url: "",
    json: true,
    ca: [
            fs.readFileSync(INCOMMONFILE, { encoding: 'utf-8'})
        ],    
    agentOptions: {
        pfx: fs.readFileSync(CERTIFICATEFILE),
        passphrase: fs.readFileSync(PASSPHRASEFILE),
        securityOptions: 'SSL_OP_NO_SSLv3'
    }
};

const SuccessResponse = (Payload, Status=200, ) => {
    return {
        Status,
        Payload
    }
};
const ErrorResponse = ex => {
    return {
        "Status": ex.statusCode,
        "Payload": ex.error.errors
    }
};

const GetGroupInfo = async group => {
    let opts = Object.assign({}, options, { 
        method: 'GET',
        url: `${GROUPSBASEURL}/group/${group}`
    });
    try {
        let res = await rp(opts);
        return res.data;
    } catch(ex) {
        throw ex;
    }
};


const Groups = {
    async IsConfidentialGroup(group) {
        return (await GetGroupInfo(group)).classification === "c";
    },
    async UpdateGroup(group) {
        return false;
    },
    async AddMember(group, identifier) {
        let opts = Object.assign({}, options, { 
            method: 'PUT',
            url: `${GROUPSBASEURL}/group/${group}/member/${identifier}`
        });
        try {
            let res = await rp(opts);
            if(res.errors[0].notFound.length > 0) {
                return ErrorResponse({statusCode: 404, error: {errors: "User Not Found"}});
            }
            return SuccessResponse(res.errors[0], res.errors[0].status);
        } catch(ex) {
            return ErrorResponse(ex);
        }
    },
    async GetMembers(group, force=false) {        
        let opts = Object.assign({}, options, { 
            url: `${GROUPSBASEURL}/group/${group}/member${force ? '?source=registry' : ''}`
        });
        try {
            let res = await rp(opts);
            
            return SuccessResponse(res.data, res.error);
        } catch(ex) {
            return ErrorResponse(ex);
        }
    },
    async GetAdmins(group) {
        try {
            let g = await GetGroupInfo(group);
            let admins = g.admins.map((a) => a.id);
            return SuccessResponse(admins);
        } catch(ex) {
            console.log(ex)
            return ErrorResponse(ex);
        }
    },
    async RemoveMember(group, netid) {
        let opts = Object.assign({}, options, { 
            method: 'DELETE',
            url: `${GROUPSBASEURL}/group/${group}/member/${netid}?synchronized=true`
        });
        try {
            let res = await rp(opts);
            return SuccessResponse(res.errors[0], res.errors[0].status);
        } catch(ex) {
            return ErrorResponse(ex);
        }
    },
    async CreateGroup(group, confidential, description, email) {
        console.log("GROUP ADMINS", GROUPADMINS)
        let classification = confidential == "false" ? "u" : "c";
        let readers = confidential == "false" ? [] : [ { "type": "set", "id": "none"} ]; 
        let opts = Object.assign({}, options, { 
            method: 'PUT',
            url: `${GROUPSBASEURL}/group/${group}?synchronized=true`,
            body: {
                "data" : { 
                    "id": group, 
                    "displayName": GROUPDISPLAYNAME,
                    "description": description,
                    "admins": GROUPADMINS.map(admin => {
                        if(admin.indexOf('.edu') > -1) {
                            return {"id": admin, "type": "dns" };
                        } else {
                            return {"id": admin, "type": "uwnetid"};
                        }
                        
                    }),
                    "readers": readers,
                    classification
                }
            }
        });
        
        try {
            let res = await rp(opts);
            if(email === "true") {
               rp(Object.assign({}, options, {
                    method: 'PUT',
                    url: `${GROUPSBASEURL}/group/${group}/affiliate/google?status=active&sender=member`
                }));
            }
            return SuccessResponse(res.data)
        } catch(ex) {
            console.log(ex);
            return ErrorResponse(ex);
        }
    },
    async SearchGroups(group, verbose=false) {
        let opts = Object.assign({}, options, {
            method: 'GET',
            url: `${GROUPSBASEURL}/search?name=${group}*&type=effective&scope=all`
        });

        try {
            let data = (await rp(opts)).data;
            if(verbose) {
                let promises = [];
                let verboseGroups = [];
                await Promise.all(data.map(async g => {
                    let vg = await GetGroupInfo(g.regid)
                    if(vg.affiliates.length > 1) {
                        vg.email = `${vg.id}@uw.edu`;
                    }
                    verboseGroups.push(vg);
                }));
                let filter = ["regid", "displayName", "id", "url", "description", "classification", "email"];
                verboseGroups = verboseGroups.map(vg => {
                    return FilterModel(vg, filter);
                });
                data = verboseGroups;
            }
            return SuccessResponse(data.sort(function(a, b){return a.id < b.id}))
        } catch(ex) {
            return ErrorResponse(ex);
        }
    },
    async DeleteGroup(group) {
        let opts = Object.assign({}, options, { 
            method: 'DELETE',
            url: `${GROUPSBASEURL}/group/${group}?synchronized=true`
        });
        try {
            let res = await rp(opts);
            return SuccessResponse(res.errors[0], res.errors[0].status);
        } catch(ex) {
            return ErrorResponse(ex);
        }
    }
};

export default Groups;