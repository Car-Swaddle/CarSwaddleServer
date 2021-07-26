import { Container, Row, Col } from 'react-bootstrap';
import { UserContext } from '../services/user-context';
import { ReferrerService } from '../services/ReferrerService';
import { Referrer } from '../models';
import { useEffect, useState } from 'react';
import { OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import Colors from '../resources/Colors'
import CopySVG from './CopySVG'

export default function AffiliateDashboard() {

    const [referrer] = useState<Referrer | null>(UserContext.getCurrentReferrer());
    const [vanityLink, setVanityLink] = useState<string>("");
    const [requestingDashboard, setRequestingDashboard] = useState<boolean>(false);
    const [hasLoadedVanityLink, setHasLoadedVanityLink] = useState<boolean>(false);

    const [didCopyLink, setDidCopyLink] = useState<boolean>(false);

    useEffect(() => {
        if (referrer && referrer.vanityID) {
            const linkBase = process.env.REACT_APP_ENV === "production" ? "go.carswaddle.com/" : "carswaddle.test-app.link/";
            setVanityLink(`${linkBase}${referrer.vanityID}`)
        }
    }, [referrer, vanityLink, hasLoadedVanityLink])

    const styles = {
        header: {
            width: '100%'
        },
        wrapper: {
            borderTop: 'black solid 1px',
            display: 'flex',
            flexWrap: 'wrap'
        },
        copyButton: {
            width: '26px',
            height: '26px',
            stroke: Colors.brand,
            fill: Colors.brand,
        },
        button: {
            backgroundColor: Colors.background,
            borderWidth: 0,
        }
    }

    function vanityLinkView() {
        return <h4 className="text-center">Your affiliate link is {vanityLink ? <a href={`https://${vanityLink}`}>{vanityLink}</a> : <i>loading…</i>}
            <OverlayTrigger
                placement='top'
                overlay={
                    <Tooltip id={`click-to-copy`}>
                        {didCopyLink ? 'Copied' : 'Click to copy'}
                    </Tooltip>
                }
                onExited={() => setDidCopyLink(false)}
            >
                <Button style={styles.button}
                    onClick={() => {
                        navigator.clipboard.writeText(vanityLink)
                        setDidCopyLink(true)
                    }}>
                    <CopySVG fill={styles.copyButton.fill} />
                </Button>
            </OverlayTrigger>
        </h4>
    }

    return (
        <Container>
            <Row className="my-4">
                <Col>
                    {vanityLinkView()}
                </Col>
            </Row>
            <Row>
                <Col className="my-3" sm={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
                    Use your personal affiliate link to invite others to learn more about Car Swaddle and download the app.
                </Col>
                <Col className="my-3" sm={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
                    This link will take people directly to the Car Swaddle app in the App Store or Google Play store. When other people tap on this link, download the app, sign up and pay for an oil change, you will receive a portion of the profits.
                </Col>
            </Row>
            
        </Container>
    )
}