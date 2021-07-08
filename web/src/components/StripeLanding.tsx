import { Container, Row, Col } from 'react-bootstrap';
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

    React.useEffect(() => {
        function generate() {
            const user = UserContext.getCurrentUser();
            if (authorizeURI.length || !user) {
                return;
            }
            let parameters = {
                client_id: process.env.REACT_APP_ENV === "production" ? "ca_Ev4P3GYnV9zLuKcJAQGSbIc15c614wzV" : "ca_Ev4P1QZsqdxi1oJzS9SrXyooFCGiI4mC",
                redirect_uri: `${window.location.origin}/affiliate/stripe`,
    
                // Passing these parameters prefills them in the stripe oauth flow
                'stripe_user[business_type]': 'individual',
                'stripe_user[first_name]': user.firstName || undefined,
                'stripe_user[last_name]': user.lastName || undefined,
                'stripe_user[phone_number]': user.phoneNumber || undefined,
                'stripe_user[email]': user.email || undefined,
                'stripe_user[country]': "US",
                'stripe_user[product_description]': "Car Swaddle referral program. Individuals may receive compensation for customers that download the Car Swaddle app and purchase an oil change. Terms and conditions related to both the eligibility to receive and amount of compensation are governed by the agreement that individual enters into with Car Swaddle."
            };
    
            const uri = 'https://connect.stripe.com/express/oauth/authorize?' + querystring.stringify(parameters);
            setAuthorizeURI(uri);
        }
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
    }, [requestedCode, authorizeURI, finishedAuth]);
    

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
