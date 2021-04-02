import React from 'react';
import { NavLink } from 'react-router-dom';

import './NavBar.css'
import LogoutButton from '../auth/LogoutButton';


const NavBar = () => {
    return (
        <nav className='navbar'>
            <NavLink to='/' exact={true} activeClassName='nav__active'>
                Home
            </NavLink>
            &nbsp;|&nbsp;
            <NavLink to='/dev' exact={true} activeClassName='nav__active'>
                Dev
            </NavLink>
            &nbsp;|&nbsp;
            <NavLink to='/login' exact={true} activeClassName='nav__active'>
                Login
            </NavLink>
            &nbsp;|&nbsp;
            <NavLink to='/sign-up' exact={true} activeClassName='nav__active'>
                Sign Up
            </NavLink>
            &nbsp;|&nbsp;
            <LogoutButton />
        </nav>
    );
}


export default NavBar;
