import { Container, Row, Col } from 'react-bootstrap';
// import { getCurrentUserReferrer, getSummary, getTransactions, getPayStructure } from "../services/ReferrerService"
import React from 'react';
import querystring from 'querystring';
import { UserContext } from '../services/user-context';

export type StripeLandingProps = {
    finishedAuth: () => void,
}

export default function StripeLanding({finishedAuth}: StripeLandingProps) {

    const [authorizeURI, setAuthorizeURI] = React.useState("");

    function generate() {
        const user = UserContext.getCurrentUser();
        if (!user) {
            return;
        }

        let parameters = {
            // TODO - public key based on env
            client_id: "ca_Ev4P1QZsqdxi1oJzS9SrXyooFCGiI4mC"
        };
        // Optionally, the Express onboarding flow accepts `first_name`, `last_name`, `email`,
        // and `phone` in the query parameters: those form fields will be prefilled
        parameters = Object.assign(parameters, {
            // TODO - public domain based on env
            redirect_uri: `${window.location.origin}/affiliate/stripe`,
            'stripe_user[business_type]': 'individual',
            'stripe_user[first_name]': user.firstName || undefined,
            'stripe_user[last_name]': user.lastName || undefined,
            'stripe_user[email]': user.email || undefined,
            'stripe_user[country]': "US",
        });

        const uri = 'https://connect.stripe.com/express/oauth/authorize?' + querystring.stringify(parameters);
        setAuthorizeURI(uri);
    }
    if (!authorizeURI) {
        generate();
    }
    if (window.location.search) {
        // Code returned by stripe
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        if (!code) {
            console.error("No code found in path")
        }
        // TODO - Call backend
        // New endpoint (TODO - /api/stripe/oauth-confirm) confirms flow, gets stripe id, creates referrer, persists id, returns
        // After endpoint is finished and have referrer, persist and redirect to final dashboard
        
        // After success, call finishedAuth() to complete navigation
    }

    return (
        <Container>
            <Row>
                <Col><h3 className="text-center">Landing</h3></Col>
            </Row>
            <Row>
                <Col><a href={authorizeURI}>Continue setup with Stripe</a></Col>
            </Row>
        </Container>
    )
}
