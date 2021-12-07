import { Tabs, Tab } from 'react-bootstrap'
import React, { Component } from 'react';
import Migrations from '../abis/Migrations.json'
import CryptoZombies from '../abis/CryptoZombies.json'
import Web3 from 'web3';
import './App.css';

class App extends Component {

  // async componentWillMount() {
  //   await this.loadBlockchainData(this.props.dispatch)
  // }

  async loadBlockchainData(dispatch) {
    if (typeof window.ethereum !== 'undefined') {
      await window.ethereum.enable();
      const web3 = new Web3(window.ethereum)
      const netId = await web3.eth.net.getId()
      const accounts = await web3.eth.getAccounts()
      
      //load balance
      if(typeof accounts[0] !=='undefined'){
        const balance = await web3.eth.getBalance(accounts[0])
        this.setState({account: accounts[0], balance: balance, web3: web3})
      } else {
        window.alert('Please login with MetaMask')
      }

      //load contracts
      try {
        const migrations = new web3.eth.Contract(Migrations.abi, Migrations.networks[netId].address)
        const cryptoZombies = new web3.eth.Contract(CryptoZombies.abi, CryptoZombies.networks[netId].address)
        this.setState({migrations, cryptoZombies})
      } catch (e) {
        console.log('Error', e)
        window.alert('Contracts not deployed to the current network')
      }

    } else {
      window.alert('Please install MetaMask')
    }
  }

  async updateAccount() {
    const web3 = new Web3(window.ethereum)
    const accounts = await web3.eth.getAccounts()
    console.log(accounts[0])
    this.setState({ account: accounts[0] })
    
    this.checkOwner().then(result => {
      this.setState({isOwner: result})
    })
    
    this.getZombiesByOwner(this.state.account).then(result => {
      this.setState({ zombieIds: result })
      console.log(this.state.zombieIds)
    })
    
    var zombies = []
    console.log(this.state.zombieIds.length)
    for (var i = 0; i < this.state.zombieIds.length; i++) {
      this.getZombiesDetails(this.state.zombieIds[i]).then(zombie => {
        if (zombie !== 0) {
          zombies.push(zombie)
          console.log(zombie)
          console.log("hello")
          this.setState({zombies: zombies})
        }
        
      })
    }

    //console.log(zombies)
    console.log(this.state.zombies)
  }

  async checkOwner() {
    if(this.state.cryptoZombies!=='undefined'){
      try{
        return this.state.cryptoZombies.methods.isOwner().call().then(result => { return result })
      } catch (e) {
        console.log('Error, getZombiesByOwner: ', e)
      }
    }
  }

  async ownerFunctions() {
  if (this.state.isOwner === true) {
    return <Tab eventKey="create" title="Create Zombie">
                  <div>
                  <br></br>
                    Create a zombie
                    <br></br>
                    (This function can only be used once per user)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let name = this.zombieName.value
                        console.log(name)
                        this.createRandomZombie(name)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='zombieName'
                          type='text'
                          ref={(input) => { this.zombieName = input }}
                          className="form-control form-control-md"
                          placeholder='name...'
                          required />
                        </div>
                        <br></br>
                      <button type='submit' className='btn btn-primary'>Create Zombie</button>
                    </form>
                  </div>
                </Tab>
  }
}

  async getZombiesByOwner(owner) {
    if(this.state.cryptoZombies!=='undefined'){
      try{
        return this.state.cryptoZombies.methods.getZombiesByOwner(owner).call().then(result => { return result })
      } catch (e) {
        console.log('Error, getZombiesByOwner: ', e)
      }
    }
  }
  
  async getZombiesDetails(id) {
    if(this.state.cryptoZombies!=='undefined'){
      try{
        return this.state.cryptoZombies.methods.zombies(id).call().then(result => { return result })
      } catch (e) {
        console.log('Error, getZombieDetails: ', e)
      }
    }
  }

  componentDidMount() {
    this.loadBlockchainData(this.props.dispatch)
    this.interval = setInterval(() => this.updateAccount(), 10000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  async createRandomZombie(name) {
    if(this.state.cryptoZombies!=='undefined'){
      try {
        console.log(this.state.account)
        this.getZombiesByOwner(this.state.account).then(function (result) {
          console.log(result)
        })
        await this.state.cryptoZombies.methods.createRandomZombie(name)
        .send({ from: this.state.account })
        .on("receipt", function (receipt) {
          console.log("success")
        })
        .on("error", function(error) {
          console.log("failed")
        })
        this.getZombiesByOwner(this.state.account).then(function (result) {
          console.log(result)
        })

      } catch (e) {
        console.log('Error, creation: ', e)
      }
    }
  }

  async attack(zombieId,targetId) {
    if(this.state.cryptoZombies!=='undefined'){
      try {
        await this.state.cryptoZombies.methods.attack(zombieId,targetId)
        .send({ from: this.state.account })
        .on("receipt", function (receipt) {
          console.log("success")
        })
        .on("error", function(error) {
          console.log("failed")
        })
        this.getZombiesByOwner(this.state.account).then(function (result) {
          console.log(result)
        })

      } catch (e) {
        console.log('Error, attack: ', e)
      }
    }
  }
  
  async levelUp(id) {
    if (this.state.cryptoZombies !== 'undefined') {
      const web3 = new Web3(window.ethereum)
      try {
        await this.state.cryptoZombies.methods.levelUp(id)
        .send({ from: this.state.account, value: web3.utils.toWei("0.001", "ether") })
        .on("receipt", function (receipt) {
          console.log("success")
        })
        .on("error", function(error) {
          console.log("failed")
        })
      } catch (e) {
        console.log('Error, levelUp: ', e)
      }
    }
  }

  async changeName(id, name) {
    if(this.state.cryptoZombies!=='undefined'){
      try {
        await this.state.cryptoZombies.methods.changeName(id, name)
        .send({ from: this.state.account })
        .on("receipt", function (receipt) {
          console.log("success")
        })
        .on("error", function(error) {
          console.log("failed")
        })
      } catch (e) {
        console.log('Error, changeName: ', e)
      }
    }
  }

  async changeDNA(id, dna) {
    if(this.state.cryptoZombies!=='undefined'){
      try {
        await this.state.cryptoZombies.methods.changeDna(id, dna)
        .send({ from: this.state.account })
        .on("receipt", function (receipt) {
          console.log("success")
        })
        .on("error", function(error) {
          console.log("failed")
        })
      } catch (e) {
        console.log('Error, changeDNA: ', e)
      }
    }
  }
  
  async transferFrom(account, id) {
    if(this.state.cryptoZombies!=='undefined'){
      try {
        await this.state.cryptoZombies.methods.transferFrom(this.state.account, account, id)
        .send({ from: this.state.account })
        .on("receipt", function (receipt) {
          console.log("success")
        })
        .on("error", function(error) {
          console.log("failed")
        })
      } catch (e) {
        console.log('Error, transferFrom: ', e)
      }
    }
  }

  constructor(props) {
    
    super(props)
    this.state = {
      interval: null,
      migrations: null,
      cryptoZombies: null,
      web3: 'undefined',
      zombieIds: [],
      zombies: [],
      account: '',
      balance: 0,
      isOwner: false
    }
  }
  
  render() {
     const renderTest = () => {
      if (this.state.isOwner) {
        return <h1> hi </h1>
      } else {
        return <h1> bye </h1>
      }
    }
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          >
          <b>CryptoZombies</b>
        </a>
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>Welcome to CryptoZombies</h1>
          <h2>{this.state.account}</h2>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
                <Tab eventKey="create" title="Create Zombie">
                  <div>
                  <br></br>
                    Create a zombie
                    <br></br>
                    (This function can only be used once per user)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let name = this.zombieName.value
                        console.log(name)
                        this.createRandomZombie(name)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='zombieName'
                          type='text'
                          ref={(input) => { this.zombieName = input }}
                          className="form-control form-control-md"
                          placeholder='name...'
                          required />
                        </div>
                        <br></br>
                      <button type='submit' className='btn btn-primary'>Create Zombie</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="attack" title="Attack">
                  <div>
                  <br></br>
                    Attack another zombie
                    <br></br>
                    Input your zombie's Id and then the target zombie's Id.
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                        let zombieId = this.zombieId.value
                        let targetId = this.targetId.value
                        console.log(zombieId,targetId)
                        this.attack(zombieId,targetId)
                    }}>
                      <div className='form-group mr-sm-2'>
                        <br></br>
                        <input
                          id='zombieId'
                          type='number'
                          ref={(input) => { this.zombieId = input }}
                          className="form-control form-control-md"
                          placeholder='zombieId...'
                          required />
                      </div>
                      <br></br>
                      <div className='form-group mr-sm-2'>
                        <br></br>
                        <input
                          id='targetId'
                          type='number'
                          ref={(input) => { this.targetId = input }}
                          className="form-control form-control-md"
                          placeholder='targetId...'
                          required />
                      </div>
                      <br></br>
                      <button type='submit' className='btn btn-primary'>Attack</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="levelUp" title="Level Up">
                  <div>
                  <br></br>
                    Level up a zombie
                    <br></br>
                    (Cost is 0.001 ether)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let id = this.levelZombieId.value
                        console.log(id)
                        this.levelUp(id)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='zombieId'
                          type='number'
                          ref={(input) => { this.levelZombieId = input }}
                          className="form-control form-control-md"
                          placeholder='zombieId...'
                          required />
                        </div>
                        <br></br>
                      <button type='submit' className='btn btn-primary'>Level up</button>
                    </form>
                  </div>
                  </Tab>
                  <Tab eventKey="changeName" title="Change Name">
                  <div>
                  <br></br>
                    Change the name of a zombie
                    <br></br>
                    (Zombie must be at least level 2)
                    <br></br>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                      let id = this.changeZombieId.value
                        let name = this.name.value
                        console.log(id)
                        console.log(name)
                        this.changeName(id, name)
                      }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='id'
                          type='number'
                          ref={(input) => { this.changeZombieId = input }}
                          className="form-control form-control-md"
                          placeholder='zombie Id...'
                          required />
                      </div>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='name'
                          type='text'
                          ref={(input) => { this.name = input }}
                          className="form-control form-control-md"
                          placeholder='New name...'
                          required />
                      </div>
                        <br></br>
                      <button type='submit' className='btn btn-primary'>Change Name</button>
                    </form>
                  </div>
                  </Tab>
                  <Tab eventKey="changeDNA" title="Change DNA">
                  <div>
                  <br></br>
                    Change the DNA of a zombie
                    <br></br>
                    (Zombie must be at least level 20)
                    <br></br>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        let id = this.zombieId.value
                        let dna = this.dna.value
                        console.log(id)
                        console.log(dna)
                        this.changeDNA(id, dna)
                      }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='id'
                          type='number'
                          ref={(input) => { this.zombieId = input }}
                          className="form-control form-control-md"
                          placeholder='zombie Id...'
                          required />
                      </div>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='dna'
                          type='text'
                          ref={(input) => { this.dna = input }}
                          className="form-control form-control-md"
                          placeholder='New name...'
                          required />
                      </div>
                        <br></br>
                      <button type='submit' className='btn btn-primary'>Change DNA</button>
                    </form>
                  </div>
                  </Tab>
                <Tab eventKey="transfer" title="Transfer Zombie">
                  <div>
                  <br></br>
                    Transfer your zombie to someone else
                    <br></br>
                    (Please enter the address you want to send it to and the zombieId you want to send)
                    <br></br>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        let sendAccount = this.sendAccount.value
                        let id = this.sendZombieId.value
                        console.log(sendAccount)
                        console.log(id)
                        this.transferFrom(sendAccount, id)
                      }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='account'
                          type='text'
                          ref={(input) => { this.sendAccount = input }}
                          className="form-control form-control-md"
                          placeholder='Transfer to this account...'
                          required />
                      </div>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='id'
                          type='number'
                          ref={(input) => { this.sendZombieId = input }}
                          className="form-control form-control-md"
                          placeholder='zombie Id...'
                          required />
                      </div>
                        <br></br>
                      <button type='submit' className='btn btn-primary'>Transfer Zombie</button>
                    </form>
                  </div>
                  </Tab>
                  <Tab eventKey="transfer" title="Transfer Zombie">
                  {renderTest()}
                  </Tab>
                </Tabs>
                {renderTest()}
                <div id="zombies">
                  {this.state.zombies.map(zombie => (
                    <ul key={zombie.name}>
                      <li>Zombie name:{zombie.name}</li>
                      <li>dna: {zombie.dna}</li>
                      <li>level: {zombie.level}</li>
                      <li>readyTime: {zombie.readyTime}</li>
                      <li>wincount: {zombie.winCount}</li>
                      <li>losscount: {zombie.lossCount}</li>
                    </ul>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
