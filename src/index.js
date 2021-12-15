import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';


var GRID_SIZE = 9;
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


function addCount(count,key){
  if (!count[key[0]]) {
    count[key[0]] = {};
 }
 count[key[0]][key[1]] = true
 return count;
}

function addCountUp(count) {
     const columns = Object.keys(count);
     let totalSpaces = 0;
     columns.forEach(columnIdx => {
         const rowValues = count[columnIdx];
         totalSpaces += Object.keys(rowValues).length
     });
      return totalSpaces;
 }
function equals (boardState, otherBoardState){
  if(!boardState || !otherBoardState ) {
    // console.log('skipping equals cause one board is null');
    return false;
  }
  let isMatch = true;
  boardState.forEach((row, rowIdx) => {
    row.forEach((columnValue, columnIdx) => {
      const otherBoardValue = otherBoardState[rowIdx][columnIdx];
      if (columnValue !== otherBoardValue) {
        isMatch = false;
      }
    });
  })
  return isMatch;
}

class Go_Game {
  constructor(size){
    this.state={
      current_color:board_values.BLACK,
      size:size,
      last_move_pass:false,
      in_atari:false,
      attempted_suicide:false,
      boardstate:this.create_board(size),
      lastState: null,
      scoringMode: false,
    }
    this.onPlay = this.onPlay.bind(this);
    this.onScore = this.onScore.bind(this);
    this.pass = this.pass.bind(this);
    this.switchPlayer = this.switchPlayer.bind(this);
    this.end_game = this.end_game.bind(this);
    this.newGame = this.newGame.bind(this);
    this.create_board = this.create_board.bind(this);
  }

  copyState(boardstate) {
    const copyBoard = this.create_board(this.state.size);
    boardstate.forEach((row, rowIdx) => {
      row.forEach((columnValue, columnIdx) => {
        copyBoard[rowIdx][columnIdx] = columnValue
      })
    });
    return copyBoard
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
  switchScorer() {
    var  newCurrentColor;
        if(this.state.current_color === board_values.BLACKSCORE)
          newCurrentColor = board_values.WHITESCORE 
        else if(this.state.current_color === board_values.WHITESCORE)
          newCurrentColor = board_values.NEUTRAL
        else if(this.state.current_color === board_values.NEUTRAL)
          newCurrentColor = board_values.BLACKSCORE

     return newCurrentColor;
   }
  onScore(row, col) {

    this.countPoints();
    var group = this.getGroup(row,col)
    if(this.state.boardstate[row][col]=== board_values.WHITE || this.state.boardstate[row][col] === board_values.BLACK)
    {
        if(this.state.boardstate[row][col]=== board_values.WHITE)
        {
          group.forEach(key => {
            this.state.boardstate[key[0]][key[1]] = board_values.WHITEINBLACK
          })
        }
        else{
          group.forEach(key => {
            this.state.boardstate[key[0]][key[1]] = board_values.BLACKINWHITE
          })
        }
    }
    else if(this.state.boardstate[row][col] === board_values.WHITEINBLACK || this.state.boardstate[row][col] === board_values.BLACKINWHITE){
      if(this.state.boardstate[row][col] === board_values.WHITEINBLACK){
        group.forEach(key => {
          this.state.boardstate[key[0]][key[1]] = board_values.WHITE
      })
    }
      if(this.state.boardstate[row][col] === board_values.BLACKINWHITE){
        group.forEach(key => {
          this.state.boardstate[key[0]][key[1]] = board_values.BLACK
      })
    }
  }
    else{
    group.forEach(key => {
      this.state.boardstate[key[0]][key[1]]= this.state.current_color;
    })
  }
    const newCurrentColor = this.switchScorer();
    this.state={
      ...this.state,
      current_color: newCurrentColor,
    }

    this.countPoints();
    this.renderBoard();
  }

  onPlay(row,col)
  {
    const previousState = this.copyState(this.state.boardstate);
     var color = this.state.boardstate[row][col] = this.state.current_color;
     var captured = [];
     var neighbours = this.getNeighbours(row,col);
     var atari = false;
    neighbours.forEach(key => {
      var state = this.state.boardstate[key[0]][key[1]];
      if(state !== board_values.EMPTY && state !==color ){
        var group = this.getLiberties(key[0],key[1]);
        if(group["liberties"]===0)
          captured.push(group);
        else if (group["liberties"]===1)
          atari=true;
      }
    });

    //detect attempted_suicide
    if((captured.length=== 0 || captured === undefined) && this.getLiberties(row,col)["liberties"]===0){
      this.state.boardstate[row][col] = board_values.EMPTY;
      this.attempted_suicide=true;
      console.log("Attempted Suicide")
      return false;
    }
    //capture
    // console.log(captured)
    captured.forEach(group => {
      group["stones"].forEach(stone => {
        this.state.boardstate[stone[0]][stone[1]] = board_values.EMPTY;
      });
      if(color===board_values.BLACK)
        capturedbyblack+= group["stones"].length;
      if(color === board_values.WHITE)
        capturedbywhite+=group["stones"].length;
    });


    //detect ko
    if(equals(this.state.boardstate,this.state.lastState)){
      this.state.boardstate = previousState;
      console.log("Attempted Ko");
      return false;
    }

    if (atari)
        this.in_atari = true;
     this.state.last_move_pass = false;

     const newBoardState = this.state.boardstate.reduce((acc, boardrow) => {
       const newRow = [...boardrow];
       acc.push(newRow);
       return acc;
     }, []);

     newBoardState[row][col] = this.state.current_color;
     const newCurrentColor = this.switchPlayer();
     this.state={
       ...this.state,
       boardstate: newBoardState,
       lastState: previousState,
       current_color: newCurrentColor,
     }
     this.renderBoard();
    return true;
  }
  switchPlayer() {
    const  newCurrentColor =
        this.state.current_color === board_values.BLACK ? board_values.WHITE : board_values.BLACK;
     return newCurrentColor;
   }
   pass() {
     const newLastMovePass = this.state.last_move_pass;
     const newCurrentColor = this.switchPlayer();
     this.state = {
       ...this.state,
       current_color: newCurrentColor,
       last_move_pass: newLastMovePass,
     }

     this.state.last_move_pass = true;
     this.renderBoard();
    if (newLastMovePass===true)
      return this.end_game();

      return {
        newCurrentColor,
        newLastMovePass,
      }
}

    end_game(){
      console.log('game is over')
      this.state.current_color = board_values.BLACKSCORE;
      this.state.scoringMode = true;
    }

    newGame(){
      console.log('New Game')
      for(let i=0;i<GRID_SIZE;i++){
        for(let j=0;j<GRID_SIZE;j++){
          this.state.boardstate[i][j]=board_values.EMPTY;
        }
      }
      this.state.current_color=board_values.BLACK;
      this.state.lastState=null;
      this.state.last_move_pass=false;
      this.state.scoringMode=false;
      this.renderBoard();
      capturedbywhite=0;capturedbyblack=0;
    }

    getNeighbours(i,j) {
      var neighbours = [];
      if(i>0)
        neighbours.push([i-1,j])
      if(i<GRID_SIZE-1)
          neighbours.push([i+1,j])
      if(j>0)
        neighbours.push([i,j-1])
      if(j<GRID_SIZE-1)
        neighbours.push([i,j+1])

      return neighbours;
    }

    getLiberties(i,j) {
      var color = this.state.boardstate[i][j];
      if( color === board_values.EMPTY )
        return null;
      var visited = {};
      var visited_list=[];
      var queue = [[i, j]];
      var count = {};
      while (queue.length > 0) {
          var stone = queue.pop();
          if (visited[stone])
              continue;
      var neighbours = this.getNeighbours(stone[0],stone[1]);
      neighbours.forEach(key => {
        var state = this.state.boardstate[key[0]][key[1]]
        if(state===board_values.EMPTY){
            count = addCount(count,key);
        }
        if(state===color)
          queue.push([key[0],key[1]])
      });
      visited[stone] = true;
      visited_list.push(stone);
    }

      return{
          "liberties": addCountUp(count),
          "stones" : visited_list,
      }
}
    getGroup(i,j){
      var color = this.state.boardstate[i][j];
      var visited = {};
      var visited_list =[];
      var queue = [[i,j]];
      while (queue.length > 0){
        var stone = queue.pop();
        if(visited[stone])
          continue;
      var neighbours = this.getNeighbours(stone[0],stone[1]);
      neighbours.forEach(key => {
        var state = this.state.boardstate[key[0]][key[1]]
        if(state === color)
          queue.push([key[0],key[1]])
        });
        visited[stone]=true;
        visited_list.push(stone);
      }
      return visited_list;
    }

    countPoints(){
      var state = this.state.boardstate;
      blackpoints =0;
      whitepoints =0;
      console.log(state);
      for(let i=0;i<state.length;i++){
        for(let j=0;j<state[i].length;j++){
          if(state[i][j]=== board_values.BLACKSCORE)
            blackpoints++;
          if(state[i][j] === board_values.WHITESCORE)
            whitepoints++;
          if(state[i][j] === board_values.BLACKINWHITE)
            whitepoints += 2;
          if(state[i][j] === board_values.WHITEINBLACK)
            blackpoints +=2;
        }
      }
    }

  renderBoard() {
    // create new wrapper component , have it render components
    // pass in 'scoring mode'  to wrapper component
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
       console.log(this.props)
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
        <font> Black Captures:  {capturedbyblack +  "\t"  }
        White Captures:   {capturedbywhite}</font>
      </div>
    )
  }
}

class Points extends React.Component{
  render(){
    return (
      <div>
        <font> Black Points:  {capturedbyblack + blackpoints }
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
      </div>
       )
    }
  }
};

const MainBoard = new Go_Game(GRID_SIZE);
MainBoard.renderBoard();