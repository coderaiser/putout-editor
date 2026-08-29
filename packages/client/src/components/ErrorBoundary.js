import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
        };
    }
    
    static getDerivedStateFromError(error) {
        return {
            error,
        };
    }
    
    componentDidCatch(error, info) {
        if (this.props.onError)
            this.props.onError(error, info);
    }
    
    reset() {
        this.setState({
            error: null,
        });
    }
    
    render() {
        if (this.state.error) {
            if (this.props.fallback)
                return this.props.fallback(this.state.error, () => this.reset());
            
            return (
                <div className="error-boundary">
                    <p>Something went wrong.</p>
                    <button onClick={() => this.reset()}>Try again</button>
                </div>
            );
        }
        
        return this.props.children;
    }
}
