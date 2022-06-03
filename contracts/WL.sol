// contracts/WL.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

// https://ethereum.stackexchange.com/questions/15168/payable-sent-hold-amount-sent-back-mechanism-refund

/// @title A blacklist / whitelist manager contract
/// @author Florian Polier
/// @dev All function calls are currently implemented without side effects
contract WL is Ownable {

    uint requestFee = 0.5 ether;
    uint public receivedWei;
    uint public returnedWei;
    mapping(address => Client) public clientStructs;
    address[] public clientList;
    enum AddressStatus{ UNKNOWN, WHITELISTED, BLACKLISTED }


    struct Client 
    {
        uint received;
        uint returned;
        string mail_address;
        string mail_hash;
        AddressStatus addressStatus;
        uint clientListPointer;
    }
    
    function getStatus() public view returns (AddressStatus){
        if(isWhitelisted()){
            return AddressStatus.WHITELISTED;
        }
        else if(isBlacklisted()){
            return AddressStatus.BLACKLISTED;
        }
        else{
            return AddressStatus.UNKNOWN;
        }
    }

    function isWhitelisted() public view returns(bool){
        return isClient(msg.sender) && clientStructs[msg.sender].addressStatus == AddressStatus.WHITELISTED;
    }

    function isBlacklisted() public view returns(bool){
        return isClient(msg.sender) && clientStructs[msg.sender].addressStatus == AddressStatus.BLACKLISTED;
    }


    function isClient(address client) public view returns(bool){
        if(clientList.length==0) return false;
        return clientList[clientStructs[client].clientListPointer]==client;
    }

    function makeRequest(string memory _mail_address, string memory mail_hash) external payable {
        require(msg.value == requestFee);
        if(!isClient(msg.sender)) {
            clientList.push(msg.sender);
            clientStructs[msg.sender] = Client(msg.value, 0,_mail_address, mail_hash, AddressStatus.UNKNOWN, clientList.length - 1);
            emit newClient(msg.sender, msg.value, _mail_address, mail_hash);
        } else{
            clientStructs[msg.sender].received += msg.value;
            emit newClient(msg.sender, msg.value, _mail_address, "Already client");
        }
        receivedWei += msg.value;
    }

    event newClient(address indexed from, uint _value, string _mail_address, string mail_hash);


    function whitelistAddress(address addressToWhitelist) external onlyOwner returns (bool)  {
        require(isClient(addressToWhitelist));
        clientStructs[addressToWhitelist].addressStatus = AddressStatus.WHITELISTED;
        return true;
    }

    function blacklistAddress(address addressToWhitelist) external onlyOwner returns (bool) {
        require(isClient(addressToWhitelist));
        clientStructs[addressToWhitelist].addressStatus = AddressStatus.BLACKLISTED;
        return true;
    }



    function payMeBack() public returns(bool success){
        require(isWhitelisted());
        uint netOwed = clientStructs[msg.sender].received - clientStructs[msg.sender].returned;
        clientStructs[msg.sender].returned = clientStructs[msg.sender].received;
        assert(payable(msg.sender).send(netOwed));
        return true;
    }

    function getContractBalance()  public view returns(uint) {
        return address(this).balance;
    }
}