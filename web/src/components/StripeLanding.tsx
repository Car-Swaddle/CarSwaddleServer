import { Container, Row, Col } from 'react-bootstrap';
// import { getCurrentUserReferrer, getSummary, getTransactions, getPayStructure } from "../services/ReferrerService"
import React from 'react';
import querystring from 'querystring';
import { UserContext } from '../services/user-context';
import { ReferrerService } from '../services/ReferrerService';

export type StripeLandingProps = {
    finishedAuth: () => void,
}

export default function StripeLanding({finishedAuth}: StripeLandingProps) {

    const [authorizeURI, setAuthorizeURI] = React.useState("");
    const [requestedCode, setRequestedCode] = React.useState(false);

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
            redirect_uri: `${window.location.origin}/affiliate/stripe`,
            'stripe_user[business_type]': 'individual',
            'stripe_user[first_name]': user.firstName || undefined,
            'stripe_user[last_name]': user.lastName || undefined,
            'stripe_user[phone_number]': user.phoneNumber || undefined,
            'stripe_user[email]': user.email || undefined,
            'stripe_user[country]': "US",
        });

        const uri = 'https://connect.stripe.com/express/oauth/authorize?' + querystring.stringify(parameters);
        setAuthorizeURI(uri);
    }

    React.useEffect(() => {
        generate();

        if (window.location.search && !requestedCode) {
            // Code returned by stripe
            const searchParams = new URLSearchParams(window.location.search);
            const code = searchParams.get('code') ?? "";
            if (code) {
                setRequestedCode(true);
    
                ReferrerService.finishStripeOauthFlow(code).then((referrer) => {
                    if (!referrer) {
                        console.error("Failed to finish stripe flow")
                        return;
                    }
                    UserContext.setCurrentReferrer(referrer);
                    finishedAuth();
                }).catch(() => {
                    console.error("Failed to finish stripe flow");
                })
            } else {
                console.warn("No code found");
            }
        }
    })
    

    return (
        <Container>
            <Row>
                <Col sm={{span: 8, offset: 2}} lg={{span: 6, offset: 3}}>By clicking the link below, you’ll be directed to Stripe. We use Stripe to process all payments you’ll receive from our referral program.</Col>
            </Row>
            <Row>
                <Col>
                    <div className="my-4 text-center">
                    {(requestedCode ?
                        <div className="spinner-border" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    : <a href={authorizeURI}>
                        <div className="stripe-connect" style={{width: "100%"}}/>
                        </a>)}
                    </div>
                </Col>
            </Row>
            <Row>
                <Col sm={{span: 8, offset: 2}} lg={{span: 6, offset: 3}}>Once you’ve connected your Stripe account, you’ll be redirected to your Car Swaddle affiliate dashboard.</Col>
            </Row>
        </Container>
    )
}
