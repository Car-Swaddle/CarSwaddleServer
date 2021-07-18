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
    const [stripeDashboardLink, setStripeDashboardLink] = useState<string | null>();

    const [didCopyLink, setDidCopyLink] = useState<boolean>(false);

    useEffect(() => {
        if (referrer && referrer.vanityID && !requestingDashboard) {
            const linkBase = process.env.REACT_APP_ENV === "production" ? "go.carswaddle.com/" : "carswaddle.test-app.link/";
            setVanityLink(`${linkBase}${referrer.vanityID}`)
            if (!stripeDashboardLink && !requestingDashboard) {
                const requestLink = async () => {
                    const link = await ReferrerService.generateExpressLoginLink(referrer.id ?? "");
                    if (link && link.link) {
                        setStripeDashboardLink(link.link);
                    }
                }
                requestLink();
                setRequestingDashboard(true);
            }
        }
    }, [referrer, vanityLink, requestingDashboard, stripeDashboardLink])

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

    return (
        <Container>
            <Row>
                <Col className="my-3" sm={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
                    Use your personal affiliate link below to invite others to learn more about Car Swaddle and download the app.
                </Col>
                <Col className="my-3" sm={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }}>
                This link will take people directly to the Car Swaddle app in the App Store or Google Play store. When other people tap on this link, download the app, sign up and pay for an oil change, you will receive a portion of the profits.
                </Col>
            </Row>
            <Row className="my-4">
                <Col>
                    {vanityLink ?
                        <h4 className="text-center">Your affiliate link is <a href={`https://${vanityLink}`}>{vanityLink}</a>
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
                        :
                        <h4 className="text-center">Unable to generate your affiliate link, please contact <a href="mailto:support@carswaddle.com">support@carswaddle.com</a></h4>
                    }
                </Col>
            </Row>
            <Row className="my-2">
                <Col>
                {stripeDashboardLink ?
                    <h4 className="text-center"><a href={stripeDashboardLink}>Stripe dashboard <i className="fas fa-arrow-right"></i></a></h4>
                    :
                    <div></div>
                }
                </Col>
            </Row>
        </Container>
    )
}