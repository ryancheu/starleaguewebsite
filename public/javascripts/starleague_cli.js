function pathFilename(path) {
    var match = /\/([^\/]+)$/.exec(path);
    if (match) {
	return match[1];
    }
}

function getRandomInt(min, max) {
    // via https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Math/random#Examples
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
    return items[getRandomInt(0, items.length-1)];
}

TerminalShell.commands['sudo'] = function(terminal) {
    var cmd_args = Array.prototype.slice.call(arguments);
    cmd_args.shift(); // terminal
    if (cmd_args.join(' ') == 'make me a sandwich') {
	terminal.print('Okay.');
    } else {
	var cmd_name = cmd_args.shift();
	cmd_args.unshift(terminal);
	cmd_args.push('sudo');
	if (TerminalShell.commands.hasOwnProperty(cmd_name)) {
	    this.sudo = true;
	    this.commands[cmd_name].apply(this, cmd_args);
	    delete this.sudo;
	} else if (!cmd_name) {
	    terminal.print('sudo what?');
	} else {
	    terminal.print('sudo: '+cmd_name+': command not found');
	}
    }
};

TerminalShell.filters.push(function (terminal, cmd) {
    if (/!!/.test(cmd)) {
	var newCommand = cmd.replace('!!', this.lastCommand);
	terminal.print(newCommand);
	return newCommand;
    } else {
	return cmd;
    }
});

TerminalShell.commands['logout'] =
    TerminalShell.commands['exit'] = 
    TerminalShell.commands['quit'] = function(terminal) {
	terminal.print('Bye.');
	$('#prompt, #cursor').hide();
	terminal.promptActive = false;
    };

TerminalShell.commands['restart'] = TerminalShell.commands['reboot'] = function(terminal) {
    if (this.sudo) {
	TerminalShell.commands['poweroff'](terminal).queue(function(next) {
	    window.location.reload();
	});
    } else {
	terminal.print('Must be root.');
    }
};

function linkFile(url) {
    return {type:'dir', enter:function() {
	window.location = url;
    }};
}

Filesystem = {
    'welcome.txt': {type:'file', read:function(terminal) {
	terminal.print($('<h4>').text('Welcome to the MIT starleague console.'));
	terminal.print('Use "ls", "cat", and "cd" to navigate the filesystem.');
    }},
    'license.txt': {type:'file', read:function(terminal) {
	terminal.print($('<p>').html('Client-side logic for Wordpress CLI theme :: <a href="http://thrind.xamai.ca/">R. McFarland, 2006, 2007, 2008</a>'));
	terminal.print($('<p>').html('jQuery rewrite and overhaul :: <a href="http://www.chromakode.com/">Chromakode, 2010</a>'));
	terminal.print();
	$.each([
	    'This program is free software; you can redistribute it and/or',
	    'modify it under the terms of the GNU General Public License',
	    'as published by the Free Software Foundation; either version 2',
	    'of the License, or (at your option) any later version.',
	    '',
	    'This program is distributed in the hope that it will be useful,',
	    'but WITHOUT ANY WARRANTY; without even the implied warranty of',
	    'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the',
	    'GNU General Public License for more details.',
	    '',
	    'You should have received a copy of the GNU General Public License',
	    'along with this program; if not, write to the Free Software',
	    'Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.'
	], function(num, line) {
	    terminal.print(line);
	});
    }}
};

function displayBattleNetList(terminal) {
    terminal.print($('<h4>').text('Displaying member name, battlenet id, and battlenet email:'));
    displayMembers(terminal);
}

var starleagueMembers = [ ["Ryan Cheu", "Ender.3156", "chuesterx@gmail.com"]];
function displayMembers(terminal) {
    terminal.print(starleagueMembers);
}

function displayMeetingInfo(terminal) {
    terminal.print("MIT Starleague meets each Friday on campus in room 4-253 at 7PM.");
    terminal.print("All skill levels are welcome, come to play games of Starcraft and watch pro matches.");
    terminal.print("It is suggested that you bring a laptop to play on, but you\'re also welcome to come and spectate!");
}

function displayYoutubeVideo(terminal, key) {
    terminal.print($('<iframe width="560" height="315" src="http://www.youtube.com/embed/' + key +'" frameborder="0" allowfullscreen></iframe>'));
}


function switchToFileSystem(filesystem) {
    return function() {
        TerminalShell.pwd = filesystem;
    }
}
    
function generateDirectory(parent, filesystem) {
    filesystem['..'] = {type:'dir', enter: switchToFileSystem(parent)};
    return {
        type: 'dir',
        enter: switchToFileSystem(filesystem)
    };
}

AboutFiles = {
    'battlenet_id_list.txt': {
        type:'file',
        read: function(terminal) {  displayBattleNetList(terminal) }
    },
    
    'meeting_info.txt': {
        type:'file',
        read: function(terminal) { displayMeetingInfo(terminal) }
    }
};

MediaFiles = {
    'KAIST_trailer.mp4': { 
        type:'file',
        read: function(terminal) { displayYoutubeVideo(terminal, 'INJ3ZA_B1Ck')}
    }
}



MediaFileSystem = generateDirectory(Filesystem, MediaFiles);
AboutFileSystem = generateDirectory(Filesystem, AboutFiles);

Filesystem['about'] = AboutFileSystem;
Filesystem['media'] = MediaFileSystem;
TerminalShell.pwd = Filesystem;


TerminalShell.commands['cd'] = function(terminal, path) {
    if (path in this.pwd) {
	if (this.pwd[path].type == 'dir') {
	    this.pwd[path].enter(terminal);
	} else if (this.pwd[path].type == 'file') {
	    terminal.print('cd: '+path+': Not a directory');
	}
    } else {
	terminal.print('cd: '+path+': No such file or directory');
    }
};

TerminalShell.commands['dir'] =
    TerminalShell.commands['ls'] = function(terminal, path) {
	var name_list = $('<ul>');
	$.each(this.pwd, function(name, obj) {
	    if (obj.type == 'dir') {
		name += '/';
	    }
	    name_list.append($('<li>').text(name));
	});
	terminal.print(name_list);
    };

TerminalShell.commands['cat'] = function(terminal, path) {
    if (path in this.pwd) {
	if (this.pwd[path].type == 'file') {
	    this.pwd[path].read(terminal);
	} else if (this.pwd[path].type == 'dir') {
	    terminal.print('cat: '+path+': Is a directory');
	}
    } else if (pathFilename(path) == 'alt.txt') {
	terminal.setWorking(true);
	num = Number(path.match(/^\d+/));
	xkcd.get(num, function(data) {
	    terminal.print(data.alt);
	    terminal.setWorking(false);
	}, function() {
	    terminal.print($('<p>').addClass('error').text('cat: "'+path+'": No such file or directory.'));
	    terminal.setWorking(false);
	});
    } else {
	terminal.print('You\'re a kitty!');
    }
};

//TODO: replace me
TerminalShell.commands['su'] = function() {
    //This is a certificate protected version
    window.location = 'https://ryancheu.scripts.mit.edu:444/starleague/';
}

TerminalShell.commands['rm'] = function(terminal, flags, path) {
    if (flags && flags[0] != '-') {
	path = flags;
    }
    if (!path) {
	terminal.print('rm: missing operand');
    } else if (path in this.pwd) {
	if (this.pwd[path].type == 'file') {
	    delete this.pwd[path];
	} else if (this.pwd[path].type == 'dir') {
	    if (/r/.test(flags)) {
		delete this.pwd[path];
	    } else {
		terminal.print('rm: cannot remove '+path+': Is a directory');
	    }
	}
    } else if (flags == '-rf' && path == '/') {
	if (this.sudo) {
	    TerminalShell.commands = {};
	} else {
	    terminal.print('rm: cannot remove /: Permission denied');
	}
    }
};

TerminalShell.commands['wget'] = TerminalShell.commands['curl'] = function(terminal, dest) {
    if (dest) {
	terminal.setWorking(true);
	var browser = $('<div>')
	    .addClass('browser')
	    .append($('<iframe>')
		    .attr('src', dest).width("100%").height(600)
		    .one('load', function() {
			terminal.setWorking(false);
		    }));
	terminal.print(browser);
	return browser;
    } else {
	terminal.print("Please specify a URL.");
    }
};

TerminalShell.commands['unixkcd'] = function(terminal, nick) {
    TerminalShell.commands['curl'](terminal, "http://www.xkcd.com/unixkcd/");
};

TerminalShell.commands['apt-get'] = function(terminal, subcmd) {
    if (!this.sudo && (subcmd in {'update':true, 'upgrade':true, 'dist-upgrade':true})) {
	terminal.print('E: Unable to lock the administration directory, are you root?');
    } else {
	if (subcmd == 'update') {
	    terminal.print('Reading package lists... Done');
	} else if (subcmd == 'upgrade') {
	    if (($.browser.name == 'msie') || ($.browser.name == 'firefox' && $.browser.versionX < 3)) {
		terminal.print($('<p>').append($('<a>').attr('href', 'http://abetterbrowser.org/').text('To complete installation, click here.')));
	    } else {
		terminal.print('This looks pretty good to me.');
	    }
	} else if (subcmd == 'dist-upgrade') {
	    var longNames = {'win':'Windows', 'mac':'OS X', 'linux':'Linux'};
	    var name = $.os.name;
	    if (name in longNames) {
		name = longNames[name];
	    } else {
		name = 'something fancy';
	    }
	    terminal.print('You are already running '+name+'.');
	} else if (subcmd == 'moo') {
	    terminal.print('        (__)');
	    terminal.print('        (oo)');
	    terminal.print('  /------\\/ ');
	    terminal.print(' / |    ||  ');
	    terminal.print('*  /\\---/\\  ');
	    terminal.print('   ~~   ~~  '); 
	    terminal.print('...."Have you mooed today?"...');
	} else if (!subcmd) {
	    terminal.print('This APT has Super Cow Powers.');
	} else {
	    terminal.print('E: Invalid operation '+subcmd);
	}
    }
};

$(document).ready(function() {
    Terminal.promptActive = false;
    $('#screen').bind('cli-load', function(e) {
        Terminal.runCommand('cat welcome.txt');
    });
    
});
