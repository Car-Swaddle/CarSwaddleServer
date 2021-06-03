import { Container, Row, Col } from 'react-bootstrap';
import { UserContext } from '../services/user-context';
import { Referrer } from '../models';
import React from 'react';

export default function AffiliateDashboard() {

    const [referrer, setReferrer] = React.useState<Referrer | null>(null);

    if (!referrer) {
        setReferrer(UserContext.getCurrentReferrer());
    }

    return (
        <Container>
            <Row className="my-3">
                <Col>
                <h4 className="text-center">Your affiliate ID is <span className="badge badge-info">{referrer?.id ?? "unknown, contact support@carswaddle.com"}</span>.
                </h4>
                </Col>
            </Row>
        </Container>
    )
}