import test from 'supertape';
import {
    render,
    screen,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import {connect, Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import ErrorMessage from './ErrorMessage.js';

const CLEAR_ERROR = 'CLEAR_ERROR';
const SET_ERROR = 'SET_ERROR';

const clearError = () => ({
    type: CLEAR_ERROR,
});

const setError = (error) => ({
    type: SET_ERROR,
    error,
});

const initialState = {
    error: null,
};

function reducer(state = initialState, action) {
    switch(action.type) {
    case SET_ERROR:
        return {
            ...state,
            error: action.error,
        };
    
    case CLEAR_ERROR:
        return {
            ...state,
            error: null,
        };
    
    default:
        return state;
    }
}

function mapStateToProps(state) {
    return {
        error: state.error,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onWantToClose: () => dispatch(clearError()),
    };
}

const ErrorMessageContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ErrorMessage);

test('ErrorMessage: no error renders nothing', (t) => {
    const store = configureStore({reducer});
    
    render(
        <Provider store={store}>
            <ErrorMessageContainer/>
        </Provider>,
    );
    
    const errorMessage = screen.queryByText('Error');
    
    cleanup();
    
    t.notOk(errorMessage);
    t.end();
});

test('ErrorMessage: error present renders message', (t) => {
    const store = configureStore({reducer});
    
    store.dispatch(setError({
        message: 'something went wrong',
    }));
    
    render(
        <Provider store={store}>
            <ErrorMessageContainer/>
        </Provider>,
    );
    
    const errorText = screen.queryByText('something went wrong');
    
    cleanup();
    
    t.ok(errorText);
    t.end();
});

test('ErrorMessage: click OK dispatches clearError', (t) => {
    const store = configureStore({reducer});
    
    store.dispatch(setError({
        message: 'dismiss me',
    }));
    
    render(
        <Provider store={store}>
            <ErrorMessageContainer/>
        </Provider>,
    );
    
    const okButton = screen.getByText('OK');
    
    fireEvent.click(okButton);
    const {error} = store.getState();
    
    cleanup();
    
    t.notOk(error);
    t.end();
});

test('ErrorMessage: renders alert svg icon', (t) => {
    const store = configureStore({reducer});
    
    store.dispatch(setError({
        message: 'icon check',
    }));
    
    render(
        <Provider store={store}>
            <ErrorMessageContainer/>
        </Provider>,
    );
    
    const svg = document.querySelector('h3 svg');
    
    cleanup();
    
    t.ok(svg, 'alert icon svg rendered');
    t.end();
});
