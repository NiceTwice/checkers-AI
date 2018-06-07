/**
 * Created by nicetwice on 04/05/17.
 */

function square(root, idx){
    var self = this;
    this.root = root;
    this.player = null;
    this.x = idx % 8;
    this.y = idx / 8 >> 0;
    this.idx= idx;
    root.text(this.x + ' ' + this.y);
}

function player(square, game){
    var self = this;
    this.unit_type = null;
    this.type = null;
    this.square = square;
    this.game = game;
    this.isKilled  = false;
    this.lastPos= {x: square.x, y: square.y};

    square.player = self;
    this.remove = function () {
        self.lastPos.x = self.square.x;
        self.lastPos.y = self.square.y;
        self.isKilled = true;
        self.square.player = null;
    };
    this.restore = function () {
        self.isKilled = false;
        self.square.player = self;
    };
    this.setSquare = function (square) {
        self.square.player = null;
        self.square = square;
        self.square.player = self;
    }
}

function move(posx, posy){
    this.isPossible = false;
    this.start_pos = {x: posx, y :posy};
    this.steps = [];
    this.killed_units = [];
    this.promotion = false;
    this.copy = function () {
        var ret = new move(posx, posy);
        ret.isPossible = this.isPossible;
        ret.steps = jQuery.extend(true, [], this.steps);
        ret.killed_units = jQuery.extend(true, [], this.killed_units);
        return ret;
    }
}


function ally(square, game) {
    player.apply(this, arguments);
    var self = this;
    this.unit_type = 'ally';
    this.type = 0;
    this.strikes = [];
    this.isPromoted = false;
    this.checkParallelStrike = function (square, square2, move) {
        if (square && square2) {
            if (square.player && square.player.type !== self.type && !square2.player) {
                for (var i = 0; i < move.killed_units.length; i++){
                    if (move.killed_units[i].x === square.x && move.killed_units[i].y === square.y)
                        return null;
                }
                move.steps.push({x: square2.x, y: square2.y});
                move.killed_units.push({x: square.x, y: square.y, player: square.player});
                if (!move.isPossible)
                    move.isPossible = true;
                move.promotion = square2.y === 0;
                this.getPossibleMoves(move);
                return move;
            }
        }
        return null;
    };
    this.checkParallel = function (square, move) {
        if (square) {
            if (!move.isPossible && !square.player) {
                move.isPossible = true;
                move.promotion = square.y === 0;
                move.steps.push({x: square.x, y: square.y});
                return move;
            }
        }
        return null;
    };
    this.getPossibleMoves = function (move) {
        var pos = move.steps.length ? move.steps[move.steps.length - 1] : move.start_pos;
        var square = null;
        if (!move.isPossible){
            this.strikes.push(self.checkParallel(getSquare(self.game.squares, pos.y - 1, pos.x - 1), move.copy()));
            this.strikes.push(self.checkParallel(getSquare(self.game.squares, pos.y - 1, pos.x + 1), move.copy()));
        }
        this.strikes.push(self.checkParallelStrike(getSquare(self.game.squares, pos.y - 1, pos.x - 1), getSquare(self.game.squares, pos.y - 2, pos.x - 2), move.copy()));
        this.strikes.push(self.checkParallelStrike(getSquare(self.game.squares, pos.y - 1, pos.x + 1), getSquare(self.game.squares, pos.y - 2, pos.x + 2), move.copy()));
        this.strikes.push(self.checkParallelStrike(getSquare(self.game.squares, pos.y + 1, pos.x - 1), getSquare(self.game.squares, pos.y + 2, pos.x - 2), move.copy()));
        this.strikes.push(self.checkParallelStrike(getSquare(self.game.squares, pos.y + 1, pos.x + 1), getSquare(self.game.squares, pos.y + 2, pos.x + 2), move.copy()));
    };

    this.updateMoves = function () {
        this.strikes = [];
        this.getPossibleMoves(new move(self.square.x, self.square.y));
        this.strikes = this.strikes.filter(function (item) {
            return item != null;
        });
    };
    this.promote = function(){
        self.unit_type = 'super_ally';
        self.checkParallelTmp = self.checkParallel;
        self.checkParallelStrikeTmp = self.checkParallelStrike;
        self.getPossibleMovesTmp = self.getPossibleMoves;
        self.checkParallel = checkParallel.bind(this);
        self.checkParallelStrike = checkParallelStrike.bind(this);
        self.getPossibleMoves = getPossibleMoves.bind(this);
        self.isPromoted = true;
    };
    this.demote = function () {
        self.unit_type = 'ally';
        self.checkParallel = self.checkParallelTmp;
        self.checkParallelStrike = self.checkParallelStrikeTmp;
        self.getPossibleMoves = self.getPossibleMovesTmp;
        self.isPromoted = false;
    }
}

function checkParallelStrike(vpos, move){
    var pos = move.steps.length ? move.steps[move.steps.length - 1] : move.start_pos;
    var vec = {x: vpos.x, y:vpos.y};
    var square = getSquare(this.game.squares, pos.y + vec.y, pos.x + vec.x);
    var square2;
    var retMove;
    var retMove2;
    while (square && !square.player){
        vec.x += vpos.x;
        vec.y += vpos.y;
        square = getSquare(this.game.squares, pos.y + vec.y, pos.x + vec.x);
    }
    if (!square || square.player.type === this.type) {
        return;
    }
    square2 = getSquare(this.game.squares, pos.y + vec.y + vpos.y, pos.x + vec.x + vpos.x);
    if (!square2 || square2.player) {
        return;
    }
    for (var i = 0; i < move.killed_units.length; i++){
        if (move.killed_units[i].x === square.x && move.killed_units[i].y === square.y)
            return;
    }
    move.isPossible = true;
    retMove = move.copy();
    retMove.killed_units.push({x:square.x, y:square.y, player: square.player});
    vec.x += vpos.x;
    vec.y += vpos.y;
    while (square2 && !square2.player){
        retMove2 = retMove.copy();
        retMove2.steps.push({x:square2.x, y:square2.y});
        vec.x += vpos.x;
        vec.y += vpos.y;
        this.strikes.push(retMove2);
        this.getPossibleMoves(retMove2);
        square2 = getSquare(this.game.squares, pos.y + vec.y, pos.x + vec.x);
    }
}
function checkParallel(vpos, move){
    var pos = move.steps.length ? move.steps[move.steps.length - 1] : move.start_pos;
    var vec = {x:vpos.x, y: vpos.y};
    var square = getSquare(this.game.squares, pos.y + vec.y, pos.x + vec.x);
    var retMove;
    while (square && !square.player){
        retMove = move.copy();
        retMove.isPossible = true;
        retMove.steps.push({x: pos.x + vec.x, y: pos.y + vec.y});
        this.strikes.push(retMove);
        vec.x += vpos.x;
        vec.y += vpos.y;
        square = getSquare(this.game.squares, pos.y + vec.y, pos.x + vec.x);
    }
}
function getPossibleMoves(move){
    if (!move.isPossible){
        this.checkParallel({x: 1, y: 1}, move);
        this.checkParallel({x:1, y: -1}, move);
        this.checkParallel({x:-1, y: 1}, move);
        this.checkParallel({x:-1, y: -1}, move);
    }
    this.checkParallelStrike({x:1, y:1}, move);
    this.checkParallelStrike({x:1, y: -1}, move);
    this.checkParallelStrike({x:-1, y:1}, move);
    this.checkParallelStrike({x:-1, y:-1}, move);
}

function isInList(y , x, list){
    for (var i = 0; i < list.length; i++){
        if (list[i].x === x && list[i].y === y)
            return true;
    }
    return false;
}
function getSquare(squares, y, x) {
    return squares[x] ? squares[x][y] : null;
}

function enemy(square){
    player.apply(this, arguments);
    var self = this;
    this.unit_type = 'enemy';
    this.type = 1;
    this.strikes = [];
    this.isPromoted = false;
    this.checkParallelStrike = function (square, square2, move) {
        if (square && square2) {
            if (square.player && square.player.type !== self.type && !square2.player) {
                for (var i = 0; i < move.killed_units.length; i++){
                    if (move.killed_units[i].x === square.x && move.killed_units[i].y === square.y)
                        return null;
                }
                move.steps.push({x: square2.x, y: square2.y});
                move.killed_units.push({x: square.x, y: square.y, player: square.player});
                move.promotion = square2.y === 7;
                if (!move.isPossible)
                    move.isPossible = true;
                this.getPossibleMoves(move);
                return move;
            }
        }
        return null;
    };
    this.checkParallel = function (square, move) {
        if (square) {
            if (!move.isPossible && !square.player) {
                move.isPossible = true;
                move.promotion = square.y === 7;
                move.steps.push({x: square.x, y: square.y});
                return move;
            }
        }
        return null;
    };
    this.getPossibleMoves = function (move) {
        var pos = move.steps.length ? move.steps[move.steps.length - 1] : move.start_pos;
        if (!move.isPossible){
            this.strikes.push(self.checkParallel(getSquare(self.game.squares, pos.y + 1, pos.x - 1), move.copy()));
            this.strikes.push(self.checkParallel(getSquare(self.game.squares, pos.y + 1, pos.x + 1), move.copy()));
        }
        this.strikes.push(self.checkParallelStrike(getSquare(self.game.squares, pos.y - 1, pos.x - 1), getSquare(self.game.squares, pos.y - 2, pos.x - 2), move.copy()));
        this.strikes.push(self.checkParallelStrike(getSquare(self.game.squares, pos.y - 1, pos.x + 1), getSquare(self.game.squares, pos.y - 2, pos.x + 2), move.copy()));
        this.strikes.push(self.checkParallelStrike(getSquare(self.game.squares, pos.y + 1, pos.x - 1), getSquare(self.game.squares, pos.y + 2, pos.x - 2), move.copy()));
        this.strikes.push(self.checkParallelStrike(getSquare(self.game.squares, pos.y + 1, pos.x + 1), getSquare(self.game.squares, pos.y + 2, pos.x + 2), move.copy()));
    };

    this.updateMoves = function () {
        this.strikes = [];
        this.getPossibleMoves(new move(self.square.x, self.square.y));
        this.strikes = this.strikes.filter(function (item) {
            return item != null;
        });
    };
    this.promote = function(){
        self.unit_type = 'super_enemy';
        self.checkParallelTmp = self.checkParallel;
        self.checkParallelStrikeTmp = self.checkParallelStrike;
        self.getPossibleMovesTmp = self.getPossibleMoves;
        self.checkParallel = checkParallel.bind(this);
        self.checkParallelStrike = checkParallelStrike.bind(this);
        self.getPossibleMoves = getPossibleMoves.bind(this);
        self.isPromoted = true;
    };
    this.demote = function () {
        self.unit_type = 'enemy';
        self.checkParallel = self.checkParallelTmp;
        self.checkParallelStrike = self.checkParallelStrikeTmp;
        self.getPossibleMoves = self.getPossibleMovesTmp;
        self.isPromoted = false;
    }
}

var game = new function () {
    var self = this;
    this.squares = [[],[],[],[],[],[],[],[]];
    this.allys = [];
    this.enemys = [];
    this.allyRound = true;
    this.history = [];
    this.selection = null;
    this.step = 0;
    this.stepMoves= [];
    this.moves = [];
    this.move = null;
    this.noKillMoves = 0;
    this.finishMove = 0;
    this.moveHistory = [];

    this.display= function () {
        $('.game_square').each(function (item) {
            $(this).attr('class', 'game_square');
        });
        for (var i = 0; i < 8; i++){
            for (var j = 0; j < 8; j++){
                if (self.squares[i][j].player)
                    self.squares[i][j].root.addClass(self.squares[i][j].player.unit_type);
            }
        }
    };
    this.init = function () {
        $('.game_square').each(function (idx) {
            var tmp = idx % 8;
            self.squares[tmp].push(new square($(this),idx));
        });

        for (var i = 0; i < 8; i++){
            for (var j = 0; j < 8; j++){
                if (self.squares[i][j].root.hasClass('enemy')) {
                    self.enemys.push(new enemy(self.squares[i][j], self));
                    self.squares[i][j].root.removeClass('enemy');
                }
                else if (self.squares[i][j].root.hasClass('ally')) {
                    self.squares[i][j].root.removeClass('ally');
                    self.allys.push(new ally(self.squares[i][j], self));
                }
            }
        }
    };
    this.compareMapDesc = function (map) {
        var matches = 0;

        self.moveHistory.map(function (item) {
            if (map.tour === item.tour){
                if (map.figures.length === item.figures.length){
                    for (var i =0; i < item.figures.length; i++){
                        if (item.figures[i].x !== map.figures[i].x ||
                            item.figures[i].y !== map.figures[i].y ||
                            item.figures[i].unit_type !== map.figures[i].unit_type)
                            return;
                    }
                    matches++;
                }
            }
        });
        console.log('matched combinations : ' + matches);
        return matches;
    };
    this.getMapDesc = function(){
        ret = {
            figures: [],
            tour: null
        };
        self.squares.map(function (item) {
            item.map(function (item) {
                if (item.player){
                    ret.figures.push({x:item.x, y:item.y, unit_type: item.player.unit_type});
                }
            });
        });
        ret.tour = self.allyRound;
        return ret;
    };
    this.countPions = function(side){
        var count = self[side];
        var ret = 0;
        count.map(function (item) {
            if(!item.isKilled){
                ret += item.isPromoted ? 50 : 1;
            }
        });
        return ret;
    };
    this.checkAllys = function () {
        for (var i = 0; i < self.allys.length; i++){
            if (!self.allys[i].isKilled)
                return false;
        }
        return true;
    };
    this.checkEnemys = function () {
        for (var i = 0; i < self.enemys.length; i++){
            if (!self.enemys[i].isKilled)
                return false;
        }
        return true;
    };
    this.init_selection = function(){
        $('.game_square').off();
        $('.game_square').removeClass('green');
        self.step = 0;
        self.moves = self.getMoves();
        if (!self.moves.length){
            alert('black won');
            return;
        }
        for (var i = 0; i < self.moves.length; i++){
            self.squares[self.moves[i].start_pos.x][self.moves[i].start_pos.y].root.addClass('green');
        }
        self.moves.forEach(function(item){
            self.squares[item.start_pos.x][item.start_pos.y].root.off();
            self.squares[item.start_pos.x][item.start_pos.y].root.on('click.tmp', function (e) {
                $('.game_square').off();
                $('.game_square').removeClass('green');
                self.init_selection2(item.start_pos.x, item.start_pos.y);
            });
        });
    };
    this.init_selection2 = function (x , y) {
        self.stepMoves = self.moves.filter(function (item) {
            return item.start_pos.x === x && item.start_pos.y === y;
        });
        self.stepMoves.forEach(function (item) {
            self.squares[item.steps[self.step].x][item.steps[self.step].y].root.addClass('green');
            self.squares[item.steps[self.step].x][item.steps[self.step].y].root.on('click', function () {
                self.select_move(item.steps[self.step].x, item.steps[self.step].y);
            });
        });
    };
    this.select_move = function (x, y){
        console.log('selecting ' + x + ' ' + y);
        $('.game_square').off();
        $('.game_square').removeClass('green');
        self.stepMoves = self.stepMoves.filter(function (item) {
            return item.steps[self.step].x === x && item.steps[self.step].y === y;
        });
        if (self.stepMoves.length === 1 && self.step === self.stepMoves[0].steps.length - 1){
            self.play_move(self.stepMoves[0]);
            return;
        }
        self.stepMoves.forEach(function (item) {
            self.squares[item.steps[self.step + 1].x][item.steps[self.step + 1].y].root.addClass('green');
            self.squares[item.steps[self.step + 1].x][item.steps[self.step + 1].y].root.on('click', function () {
                self.step++;
                self.select_move(item.steps[self.step].x, item.steps[self.step].y);
            });
        });
    };

    this.play_move_no_display = function (move) {
        var fpos = move.steps[move.steps.length - 1];
        var fsquare = self.squares[fpos.x][fpos.y];
        var killed_unit = null;
        var player = self.squares[move.start_pos.x][move.start_pos.y].player;
        if (move.promotion)
            player.promote();
        player.setSquare(fsquare);
        for (var i = 0; i < move.killed_units.length; i++){
            killed_unit = move.killed_units[i];
            self.squares[killed_unit.x][killed_unit.y].player.remove();
        }
        self.history.push(move);
        self.allyRound = !self.allyRound;
        if (player.isPromoted && !move.killed_units.length) {
            move.noKillMoves = self.history[self.history.length - 1].noKillMoves + 1;
            if (move.noKillMoves >24){
                return true;
            }
        }else {
            move.noKillMoves=0;
        }
        var allyNb = self.countPions('allys');
        var enemyNb = self.countPions('enemys');
        if (!move.killed_units.length && ((allyNb === 50 || allyNb === 100) && enemyNb === 50 ||
            (enemyNb === 50 || enemyNb === 100) && allyNb === 50)){
            return true;
        }
        if (self.finishMove){
            self.finishMove++;
            if (self.finishMove > 31){
                return true;
            }
        } else if ((allyNb === 52 || allyNb === 51 || allyNb === 101 || allyNb === 150) && enemyNb === 50 ||
            (enemyNb === 52 || enemyNb === 51 || enemyNb === 101 || enemyNb === 150) && allyNb === 50){
            self.finishMove++;
        }
        if (self.allyRound && self.checkEnemys())
            return true;
        else if (!self.allyRound && self.checkAllys())
            return true;
        return false;
    };
    this.unplay_last = function(){
        self.real_unplay_move(self.history[self.history.length - 1]);
        self.real_unplay_move(self.history[self.history.length - 1]);
        self.display();
        self.init_selection();
    };
    this.unplay_move = function (move) {
        var fpos = move.steps[move.steps.length - 1];
        var player = self.squares[fpos.x][fpos.y].player;
        player.setSquare(self.squares[move.start_pos.x][move.start_pos.y]);
        move.killed_units.forEach(function (item) {
            item.player.restore();
        });
        if (move.promotion)
            player.demote();
        if (self.finishMove)
            self.finishMove--;
        self.allyRound = !self.allyRound;
        self.history.splice(self.history.indexOf(move), 1);
    };
    this.real_unplay_move = function (move) {
        var fpos = move.steps[move.steps.length - 1];
        var player = self.squares[fpos.x][fpos.y].player;
        player.setSquare(self.squares[move.start_pos.x][move.start_pos.y]);
        move.killed_units.forEach(function (item) {
            item.player.restore();
        });
        if (move.promotion)
            player.demote();
        if (self.finishMove)
            self.finishMove--;
        self.moveHistory.splice(self.moveHistory.length - 1, 1);
        self.allyRound = !self.allyRound;
        self.history.splice(self.history.indexOf(move), 1);
    };
    this.play_move = function(move){
        console.log(move);
        var fpos = move.steps[move.steps.length - 1];
        var fsquare = self.squares[fpos.x][fpos.y];
        var killed_unit = null;
        var player = self.squares[move.start_pos.x][move.start_pos.y].player;
        if (move.promotion)
            player.promote();
        player.setSquare(fsquare);
        for (var i = 0; i < move.killed_units.length; i++){
            killed_unit = move.killed_units[i];
            self.squares[killed_unit.x][killed_unit.y].player.remove();
        }

        var mapDesc = self.getMapDesc();
        self.moveHistory.push(mapDesc);
        if (self.compareMapDesc(mapDesc) >= 3){
            alert('egality');
            return;
        }
        self.squares[move.start_pos.x][move.start_pos.y].root.removeClass(player.unit_type);
        var allyNb = self.countPions('allys');
        var enemyNb = self.countPions('enemys');
        if (!move.killed_units.length && ((allyNb === 50 || allyNb === 100) && enemyNb === 50 ||
            (enemyNb === 50 || enemyNb === 100) && allyNb === 50)){
            alert('egality');
            return;
        }
        if (self.finishMove){
            self.finishMove++;
            console.log('rounds left :' + self.finishMove);
            if (self.finishMove > 31){
                alert('egality');
                return;
            }
        }
        else if ((allyNb === 52 || allyNb === 51 || allyNb === 101 || allyNb === 150) && enemyNb === 50 ||
            (enemyNb === 52 || enemyNb === 51 || enemyNb === 101 || enemyNb === 150) && allyNb === 50){
            self.finishMove++;
            console.log('finish move : ' + self.finishMove);
        }
        if (player.isPromoted && !move.killed_units.length) {
            move.noKillMoves = self.history[self.history.length - 1].noKillMoves + 1;
            console.log('no kill move ' + move.noKillMoves);
            if (move.noKillMoves >24){
                console.log('egality');
                alert('egality');
                return ;
            }
        }else {
            move.noKillMoves = 0;
        }
        self.history.push(move);
        if (self.allyRound && self.checkEnemys()) {
            console.log('ally won');
        }
        else if (!self.allyRound && self.checkAllys()) {
            console.log('enemy won');
        }
        self.allyRound = !self.allyRound;
        game.display();
//        self.init_selection();
        if (self.allyRound)
            self.init_selection();
        else {
            playIA();
        }
    };
    this.getMoves = function () {
        var ret = [];
        if (self.allyRound){
            for (var i = 0; i < self.allys.length; i++){
                if (!self.allys[i].isKilled) {
                    self.allys[i].updateMoves();
                    ret = ret.concat(self.allys[i].strikes);
                }
            }
        }else {
            for (var i = 0; i < self.enemys.length; i++){
                if (!self.enemys[i].isKilled) {
                    self.enemys[i].updateMoves();
                    ret = ret.concat(self.enemys[i].strikes);
                }
            }
        }
        ret = ret.sort(function (a,b) {
            return b.killed_units.length - a.killed_units.length;
        });
        ret = ret.filter(function (item) {
            return item.killed_units.length === ret[0].killed_units.length;
        });
        return ret;
    };
};
game.init();
game.display();
game.init_selection();

function iaEval(){
    var allys = 0;
    var enemys = 0;
    game.allys.map(function (item) {
        if (!item.isKilled){
            if (item.unit_type === 'super_ally')
                allys += 2;
            else
                allys++;
        }
    });
    game.enemys.map(function (item) {
        if (!item.isKilled){
            if (item.unit_type === 'super_enemy')
                enemys += 2;
            else
                enemys++;
        }
    });
    return enemys - allys;
}

function playIA(){
    console.log('IA playing :');
    $('.loading').addClass('fa-spin');
    var moves = game.getMoves();
    if (!moves.length){
        alert('white won');
        $('.loading').removeClass('fa-spin');
        return null;
    }
    if (moves.length === 1){
        $('.loading').removeClass('fa-spin');
        game.play_move(moves[0]);
        return;
    }
    moves = moves.map(function(item){
        game.play_move_no_display(item);
        item.score = processMove(0, -1000, 1000);
        game.unplay_move(item);
        return item;
    });
    $('.loading').removeClass('fa-spin');
    moves = moves.sort(function (a, b) {
        return b.score - a.score;
    });
    game.play_move(moves[0]);
}

var depth = 7;
function processMove(lvl, alpha, beta) {
    var moves;
    if (lvl < depth){
        moves = game.getMoves();
        if (game.allyRound){
            if (!moves.length)
                return 30;
            for (var i = 0; i < moves.length; i++){
                if (game.play_move_no_display(moves[i]))
                    moves[i].score = -30;
                else
                    moves[i].score = processMove(lvl + 1, alpha, beta);
                game.unplay_move(moves[i]);
                alpha = Math.max(alpha, moves[i].score);
                if (alpha >= beta)
                    break
            }
            return alpha;
        }else {
            if (!moves.length)
                return -30;
            for (var i = 0; i < moves.length; i++){
                if (game.play_move_no_display(moves[i]))
                    moves[i].score = 30;
                else
                    moves[i].score = processMove(lvl + 1, alpha, beta);
                game.unplay_move(moves[i]);
                beta = Math.min(beta, moves[i].score);
                if (alpha >= beta)
                    break
            }
            return beta;
        }
    }
    return iaEval();
};