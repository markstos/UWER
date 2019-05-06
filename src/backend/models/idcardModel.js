import { IDCardWebService } from 'ews-api-lib';
import { API } from '../routes';
import fs from 'fs';
import DefaultUser from 'Assets/defaultUser';

const DefaultUserBuffer = new Buffer.from(DefaultUser.replace('data:image/jpeg;base64,', ''), 'base64');

const IDCard = {
  Setup() {
    const certificate = {
      pfx: fs.readFileSync(process.env.CERTIFICATEFILE),
      passphrase: fs.readFileSync(process.env.PASSPHRASEFILE, { encoding: 'utf8' }).toString(),
      ca: fs.readFileSync(process.env.INCOMMONFILE)
    };
    const baseUrl = process.env.IDCARDBASEURL;

    IDCardWebService.Setup(certificate, baseUrl);
  },

  ValidCard(cardnum) {
    let card = { magstrip: '', rfid: '' };
    if (cardnum.length === 16) {
      if (cardnum[0] !== ';') {
        card.rfid = cardnum;
      } else if (cardnum[0] === ';') {
        card.magstrip = cardnum.slice(1, 14);
      } else {
        return false;
      }
    } else if (cardnum.length === 14) {
      card.magstrip = cardnum;
    } else {
      return false;
    }
    // make sure we didn't catch a 14/16 character netid and treat it as a card
    if (!isNaN(parseInt(card.magstrip)) || !isNaN(parseInt(card.rfid))) {
      return card;
    } else {
      return false;
    }
  },

  async Get(card) {
    return await IDCardWebService.GetRegID(card.magstrip, card.rfid);
  },

  async GetPhoto(regid) {
    const photo = await IDCardWebService.GetPhoto(regid);
    return photo !== null ? photo : DefaultUserBuffer;
  },

  async GetManyPhotos(groupName, memberList) {
    for (let mem of memberList) {
      mem.Base64Image = await this.GetOnePhoto(groupName, mem.UWRegID);
    }
    return memberList;
  },

  async GetOnePhoto(groupName, uwRegID) {
    return 'api' + API.GetMemberPhoto.replace(':group', groupName).replace(':identifier', uwRegID);
  }
};

IDCard.Setup();

export default IDCard;
