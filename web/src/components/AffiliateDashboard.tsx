import { Container, Row, Col } from 'react-bootstrap';
import { UserContext } from '../services/user-context';
import { Referrer } from '../models';
import React from 'react';

export default function AffiliateDashboard() {

    const [referrer, setReferrer] = React.useState<Referrer | null>(UserContext.getCurrentReferrer());
    const [vanityLink, setVanityLink] = React.useState<string>("");

    React.useEffect(() => {
        if (referrer && referrer.vanityID) {
            setVanityLink(`go.carswaddle.com/${referrer.vanityID}`)
        }
    }, [referrer])

    return (
        <Container>
            <Row>
                <Col className="my-3" sm={{span: 8, offset: 2}} lg={{span: 6, offset: 3}}>
                Use the personal link below to invite others to learn more about Car Swaddle and download the app.
                </Col>
            </Row>
            <Row className="my-1">
                <Col>
                {vanityLink ?
                    <h4 className="text-center">Your affiliate link is <a href={`https://${vanityLink}`}>{vanityLink}</a></h4>
                    :
                    <h4 className="text-center">Unable to generate your affiliate link, please contact <a href="mailto:support@carswaddle.com">support@carswaddle.com</a>.</h4>
                }
                </Col>
            </Row>
        </Container>
    )
}