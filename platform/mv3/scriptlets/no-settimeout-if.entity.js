/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
    Copyright (C) 2019-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock

    The scriptlets below are meant to be injected only into a
    web page context.
*/

/* jshint esversion:11 */

'use strict';

/******************************************************************************/

/// name no-settimeout-if.entity
/// alias no-setTimeout-if.entity
/// alias nostif.entity

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_noSetTimeoutIfEntity() {

/******************************************************************************/

// $rulesetId$

const argsList = self.$argsList$;

const entitiesMap = new Map(self.$entitiesMap$);

/******************************************************************************/

const scriptlet = (
    needle = '',
    delay = ''
) => {
    const needleNot = needle.charAt(0) === '!';
    if ( needleNot ) { needle = needle.slice(1); }
    if ( delay === '' ) { delay = undefined; }
    let delayNot = false;
    if ( delay !== undefined ) {
        delayNot = delay.charAt(0) === '!';
        if ( delayNot ) { delay = delay.slice(1); }
        delay = parseInt(delay, 10);
    }
    if ( needle.startsWith('/') && needle.endsWith('/') ) {
        needle = needle.slice(1,-1);
    } else if ( needle !== '' ) {
        needle = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const reNeedle = new RegExp(needle);
    const regexpTest = RegExp.prototype.test;
    self.setTimeout = new Proxy(self.setTimeout, {
        apply: function(target, thisArg, args) {
            const a = String(args[0]);
            const b = args[1];
            let defuse;
            if ( needle !== '' ) {
                defuse = regexpTest.call(reNeedle, a) !== needleNot;
            }
            if ( defuse !== false && delay !== undefined ) {
                defuse = (b === delay || isNaN(b) && isNaN(delay) ) !== delayNot;
            }
            if ( defuse ) {
                args[0] = function(){};
            }
            return target.apply(thisArg, args);
        },
        get(target, prop, receiver) {
            if ( prop === 'toString' ) {
                return target.toString.bind(target);
            }
            return Reflect.get(target, prop, receiver);
        },
    });
};

/******************************************************************************/

const hnparts = [];
try { hnparts.push(...document.location.hostname.split('.')); } catch(ex) { }
const hnpartslen = hnparts.length - 1;
for ( let i = 0; i < hnpartslen; i++ ) {
    for ( let j = hnpartslen; j > i; j-- ) {
        const hn = hnparts.slice(i).join('.');
        const en = hnparts.slice(i,j).join('.');
        let argsIndices = entitiesMap.get(en);
        if ( argsIndices === undefined ) { continue; }
        if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
        for ( const argsIndex of argsIndices ) {
            const details = argsList[argsIndex];
            if ( details.n && details.n.includes(hn) ) { continue; }
            try { scriptlet(...details.a); } catch(ex) {}
        }
    }
}

argsList.length = 0;
entitiesMap.clear();

/******************************************************************************/

})();

/******************************************************************************/
