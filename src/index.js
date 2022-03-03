import React from 'react';
import ReactDOM from 'react-dom';
import { io } from 'socket.io-client';
import './index.css';


/*
ECS 2 AWS free tier
express 
*/
var GRID_SIZE = 19;
const intersection_size=20;

const board_values = {
  EMPTY:0,
  BLACK:1,
  WHITE:2,
  BLACKSCORE:3,
  WHITESCORE:4,
  NEUTRAL:5,
  WHITEINBLACK:6,
  BLACKINWHITE:7,
}
var capturedbywhite=0;
var capturedbyblack=0;
var blackpoints=0;
var whitepoints=0;

class Go_Game {
  constructor(size){
    this.state={
      current_color:board_values.BLACK,
      size:size,
      last_move_pass:false,
      in_atari:false,
      attempted_suicide:false,
      is_ko:false,
      boardstate:this.create_board(size),
      lastState: null,
      scoringMode: false,
      isComplete: false,
    }
    this.onPlay = this.onPlay.bind(this);
    this.onScore = this.onScore.bind(this);
    this.pass = this.pass.bind(this);
    this.newGame = this.newGame.bind(this);
    this.create_board = this.create_board.bind(this);

    // setInterval(() => {
    //   fetch('/api/getBoardState', {
    //     method: 'get', 
    //     headers: {
    //       'content-type': 'application/json',
    //     }
    //   }).then(resp => {
    //     if (resp.ok) {
  
    //       resp.json().then(jsonData => {
    //         this.state = jsonData.newBoardState
    //         this.renderBoard();
    //       });
    //     }
    //   });
    // }, 1000);
  }

  create_board(size)
  {
    var m = [];
    for (let i = 0; i < size; i++) {
        m[i] = [];
        for (let j = 0; j < size; j++)
            m[i][j] = board_values.EMPTY;
    }
    return m;
  }
 
  onScore(row, col) {
    fetch('/api/scoreMove', {
      method: 'post', 
      body: JSON.stringify({
        row : row,
        col : col,
      }),
      headers: {
        'content-type': 'application/json',
      }
    }).then(resp => {
      if (resp.ok) {

        resp.json().then(jsonData => {
          this.state = jsonData.newBoardState
          blackpoints=jsonData.blackpoints;
          whitepoints=jsonData.whitepoints;
          this.renderBoard();
        });
      }
    });

  
  }

  onPlay(row,col)
  {
    fetch('/api/playMove', {
      method: 'post', 
      body: JSON.stringify({
        row : row,
        col : col,
      }),
      headers: {
        'content-type': 'application/json',
      }
    }).then(resp => {
      if (resp.ok) {

        resp.json().then(jsonData => {
          
          this.state = jsonData.newBoardState
          capturedbyblack=jsonData.blackcaptures;
          capturedbywhite=jsonData.whitecaptures;
          this.renderBoard();
        });
      }
    });

    fetch('/sri/playMove', {
      method: 'post', 
      body: JSON.stringify({
        row : row,
        col : col,
      }),
      headers: {
        'content-type': 'application/json',
      }
    }).then(resp => {
      if (resp.ok) {
        resp.json().then(jsonData => {
          this.state = jsonData.newBoardState
          capturedbyblack=jsonData.blackcaptures;
          capturedbywhite=jsonData.whitecaptures;
        });
      }
    });
  }
   pass() {
    fetch('/api/pass', {
      method: 'post', 
      headers: {
        'content-type': 'application/json',
      }
    }).then(resp => {
      if (resp.ok) {
        resp.json().then(jsonData => {
          this.state = jsonData.newBoardState
          this.renderBoard();
        });
      }
    });

}

    newGame(){
      console.log('New Game')
      fetch('/api/newGame', {
        method: 'post', 
        headers: {
          'content-type': 'application/json',
        }
      }).then(resp => {
        if (resp.ok) {
          resp.json().then(jsonData => {
            this.state = jsonData.newBoardState
            this.renderBoard();
          });
        }
      });
    }
    

  renderBoard() {
    ReactDOM.render(
      <BoardView  board={this.state} onPlay={this.onPlay} onScore = {this.onScore} pass = {this.pass} newGame={this.newGame} />,
      document.getElementById('root')
    );
  }
}

class  BoardIntersection extends React.Component{
  constructor(props) {
          super(props)
          this.handleClick = this.handleClick.bind(this)
      }

 handleClick(){
   // If we're scoring the game
   
   if (this.props.board.scoringMode) {
     this.props.onScore(this.props.row, this.props.col);
     return;
   }
   // If we're palying the game
   if(this.props.current_color === board_values.EMPTY && !this.props.board.scoringMode) {
       this.props.onPlay(this.props.row,this.props.col)
       
     }
  }
  render() {
    var style = {
      top: this.props.row * intersection_size,
      left: this.props.col * intersection_size
    }

    var classes = "intersection "
    if(this.props.board.current_color===board_values.WHITE){
      classes += "conditional "
    }
    if(this.props.current_color === board_values.WHITE || this.props.current_color === board_values.BLACK) {
      classes += this.props.current_color === board_values.BLACK ? "black " : "white "
    }
    
    const isblackPoint = this.props.current_color===board_values.BLACKSCORE;
    if (this.props.board.scoringMode){
      if(this.props.current_color===board_values.BLACKSCORE){
        classes += "bp"
      }
      if(this.props.current_color===board_values.WHITESCORE){
        classes += "wp"
      }
      if(this.props.current_color===board_values.NEUTRAL){
        classes += "np"
      }
      if(this.props.current_color === board_values.WHITEINBLACK){
        classes += "wib"
      }
      if(this.props.current_color === board_values.BLACKINWHITE){
        classes += "biw"
      }
    }
    return (
      <div onClick={this.handleClick}
        className={classes} style={style}>
          {isblackPoint && (<div className="magic_point_class"></div>)}
      </div>
    )
  }
}

class Pass extends React.Component{
  constructor(props){
    super(props)
     this.handleClick = this.handleClick.bind(this);
  }
    handleClick() {
       this.props.pass();
    }
    render() {
        return (
            <input id="pass-btn" type="button" value="Pass"
                onClick={this.handleClick} />
        );
    }
}
class About extends React.Component{
  constructor(props){
    super(props)
     this.handleClick = this.handleClick.bind(this);
  }
    handleClick() {
    window.location.href='/api/about'
}
    render() {
        return (
            <input id="aboutme" type="button" value="About Me"
                onClick={this.handleClick} />
        );
    }
}

class Chat extends React.Component{
  constructor(props) {
    super(props);

    this.state = {
      messages: [],
      messageText: '',
    }
    this.socket = io({
      path: '/socket'
    });
    this.sendMessage = this.sendMessage.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    this.socket.on('chat message', (msg) => {
      this.setState({
        messages: [...this.state.messages, msg]
      });
    });
  }

  sendMessage(e) {
    const {
      messageText
    } = this.state;
    if (messageText) {
      this.socket.emit('chat message', messageText);
      this.setState({
        messageText: '',
      })
    }
  }

  handleInputChange(e) {
    this.setState({
      messageText: e.target.value,
    });
  }
  
  render(){
    const {
      messages,
      messageText,
    } = this.state;
    return(<div>
      <div id="container">
      <ul id="messages">
        {messages.map(m => (<li>{m}</li>))}
      </ul>
      </div>
      <input id="inputchat" autoComplete="off" onChange={this.handleInputChange} value={messageText}/>
      <button id="formbutton" onClick={this.sendMessage}>Send</button>
      </div>
    )
}
}

class NewGame extends React.Component{
  constructor(props){
    super(props)
     this.handleClick = this.handleClick.bind(this);
  }
    handleClick() {
       this.props.newGame();
    }
    render() {
        return (
            <input id="newgame-btn" type="button" value="New Game"
                onClick={this.handleClick} />
        );
    }
}

class Capture extends React.Component{
  render(){
    return (
      <div>
        <font id="text"> Black Captures:  {capturedbyblack +  "\t"  }
        White Captures:   {capturedbywhite}</font>
      </div>
    )
  }
}

class Points extends React.Component{
  render(){
    return (
      <div>
        <font id="font"> Black Points:  {capturedbyblack + blackpoints }
        White Points:   {capturedbywhite + whitepoints}</font>
      </div>
    )
  }
}

class BoardView extends React.Component{

  render() {

    const board = this.props.board;
    const onPlay = this.props.onPlay;
    const pass = this.props.pass;
    const newGame = this.props.newGame;
    const onScore = this.props.onScore;


    var intersections = [];
    for(let i=0; i<board.size; i++) {
      for(let j=0; j<board.size; j++) {
        intersections.push({
          board: board,
          current_color: board.boardstate[i][j],
          row: i,
          col: j,
          onPlay: onPlay,
          onScore: onScore,
        })
      }
    }

    var style = {
      width: this.props.board.size * GRID_SIZE,
      height: this.props.board.size * GRID_SIZE
    };
    if (this.props.board.scoringMode) {
      return (
        <div>
        <div style={style} id="board">{intersections.map(i=>(<BoardIntersection {...i} />  ))}</div>
        <Points />
       <Pass pass={pass} board={this.props.state} />
       <NewGame newGame={newGame} board ={this.props.state}/>
       <Chat chat />
      </div>
      )
    }
    else {
    return (
      <div>
        <div style={style} id="board">{intersections.map(i=>(<BoardIntersection {...i} />  ))}</div>
        <Capture />
       <Pass pass={pass} board={this.props.state} />
       <NewGame newGame={newGame} board ={this.props.state}/>
       <About about />
       <Chat chat />
      </div>
       )
    }
  }
}

const MainBoard = new Go_Game(GRID_SIZE);
MainBoard.renderBoard();