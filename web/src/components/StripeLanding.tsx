import { Container, Row, Col } from 'react-bootstrap';
// import { getCurrentUserReferrer, getSummary, getTransactions, getPayStructure } from "../services/ReferrerService"
import React from 'react';
const querystring = require("querystring");

export default function StripeLanding() {

    const [authorizeURI, setAuthorizeURI] = React.useState("");

    function generate() {
        let user: any = JSON.parse(window.localStorage.getItem('user') ?? "{}");
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
            redirect_uri: 'https://api.staging.carswaddle.com/dashboard',
            'stripe_user[business_type]': 'individual',
            'stripe_user[first_name]': user.firstName || undefined,
            'stripe_user[last_name]': user.lastName || undefined,
            'stripe_user[email]': user.email || undefined,
            'stripe_user[country]': "US",
            // If we're suggesting this account have the `card_payments` capability,
            // we can pass some additional fields to prefill:
            // 'suggested_capabilities[]': 'card_payments',
            // 'stripe_user[street_address]': req.user.address || undefined,
            // 'stripe_user[city]': req.user.city || undefined,
            // 'stripe_user[zip]': req.user.postalCode || undefined,
            // 'stripe_user[state]': req.user.city || undefined,
        });

        const uri = 'https://connect.stripe.com/express/oauth/authorize?' + querystring.stringify(parameters);
        setAuthorizeURI(uri);

        // if we have something in ?code=, post to endpoint (needs to be added)
        // New endpoint confirms flow, gets stripe id, creates referrer, persists id, returns
        // After endpoint is finished and have referrer, redirect to final dashboard
        // On referrer login, check if has stripe id and if so redirect to dashboard
    }
    if (!authorizeURI) {
        generate();
    }

    return (
        <Container>
            <Row>
                <Col><h3 className="text-center">Landing</h3></Col>
            </Row>
            <Row>
                // Call backend for url, put in href
                <Col><a href={authorizeURI}>Continue setup with Stripe</a></Col>
            </Row>
        </Container>
    )
}